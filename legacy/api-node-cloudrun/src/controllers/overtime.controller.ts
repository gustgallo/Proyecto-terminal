import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const createOvertimeSchema = z.object({
  projectId: z.number().optional(),
  startDateTime: z.string().min(10, 'Fecha y hora de inicio requerida'),
  endDateTime: z.string().min(10, 'Fecha y hora de fin requerida'),
  justification: z.string().min(5, 'Proporciona una justificación adecuada'),
});

const toMysqlDateTime = (date: Date): string => date.toISOString().slice(0, 19).replace('T', ' ');

export const createOvertime = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createOvertimeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de horas extras inválidos', details: parseResult.error.format() });
    }

    const { projectId, startDateTime, endDateTime, justification } = parseResult.data;
    const userId = req.user!.id;

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha y hora inválido.' });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'La fecha y hora de fin debe ser posterior a la de inicio.' });
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const hoursCount = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const insert = await executeWrite(
      `INSERT INTO overtime_records (user_id, project_id, start_date_time, end_date_time, hours_count, approved_hours_count, justification, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_JEFE')`,
      [userId, projectId || null, toMysqlDateTime(startDate), toMysqlDateTime(endDate), hoursCount, hoursCount, justification]
    );

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [insert.insertId]);
    return res.status(201).json({
      message: 'Registro de horas extras enviado a revisión',
      record: rows[0],
    });
  } catch (error) {
    console.error('Error al registrar horas extras:', error);
    return res.status(500).json({ error: 'Error al procesar el registro.' });
  }
};

export const getOvertimeRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { roleCode, id: userId } = req.user!;

    let query = `
      SELECT o.*, 
             CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name, u.email AS employee_email, u.department,
             p.name AS project_name, p.code AS project_code,
             CONCAT_WS(' ', ja.first_name, ja.last_name) AS area_boss_name,
             CONCAT_WS(' ', rh.first_name, rh.last_name) AS rrhh_name
      FROM overtime_records o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN projects p ON o.project_id = p.id
      LEFT JOIN users ja ON o.reviewed_by_area = ja.id
      LEFT JOIN users rh ON o.reviewed_by_rrhh = rh.id
    `;
    const params: unknown[] = [];

    if (roleCode === 'ADMIN_GLOBAL' || roleCode === 'ADMIN_RRHH' || roleCode === 'PRODUCCION' || roleCode === 'MESA_CONTROL') {
      query += ` ORDER BY o.created_at DESC`;
    } else {
      query += ` WHERE o.user_id = ? ORDER BY o.created_at DESC`;
      params.push(userId);
    }

    const records = await queryRows<RowDataPacket>(query, params);

    let statsQueryStr = `
      SELECT 
        COALESCE(SUM(hours_count), 0) AS total_requested_hours,
        COALESCE(SUM(CASE WHEN status = 'APROBADO' THEN COALESCE(approved_hours_count, hours_count) ELSE 0 END), 0) AS total_approved_hours,
        COALESCE(SUM(CASE WHEN status = 'RECHAZADO' THEN hours_count ELSE 0 END), 0) AS total_rejected_hours,
        COALESCE(SUM(CASE WHEN status IN ('PENDIENTE_JEFE', 'PENDIENTE_RRHH') THEN hours_count ELSE 0 END), 0) AS total_pending_hours,
        COUNT(*) AS total_records_count
      FROM overtime_records
    `;
    const statsParams: unknown[] = [];

    if (roleCode === 'EMPLEADO_INTERNO') {
      statsQueryStr += ` WHERE user_id = ?`;
      statsParams.push(userId);
    }

    const statsRows = await queryRows<RowDataPacket>(statsQueryStr, statsParams);

    return res.json({
      records,
      dashboardStats: statsRows[0],
    });
  } catch (error) {
    console.error('Error al consultar horas extras:', error);
    return res.status(500).json({ error: 'Error al consultar registros.' });
  }
};

export const approveByArea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { areaNotes, approvedHoursCount } = req.body;
    const reviewerId = req.user!.id;

    const recordRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    if (recordRows.length === 0) {
      return res.status(404).json({ error: 'Registro de horas extras no encontrado.' });
    }
    const record = recordRows[0];

    const finalApprovedHours = approvedHoursCount ? parseFloat(approvedHoursCount) : Number(record.hours_count);
    const isModified = finalApprovedHours !== Number(record.hours_count);

    await executeWrite(
      `UPDATE overtime_records
       SET status = 'PENDIENTE_RRHH', reviewed_by_area = ?, area_boss_notes = ?, approved_hours_count = ?
       WHERE id = ?`,
      [reviewerId, areaNotes || 'Visto bueno otorgado por Jefe de Área', finalApprovedHours, id]
    );

    const notifTitle = isModified ? 'Horas Extras Modificadas por Jefe' : 'Horas Extras Pre-Aprobadas';
    const notifMsg = isModified
      ? `Tus horas extras del ${new Date(record.start_date_time).toLocaleDateString()} fueron modificadas de ${record.hours_count} hrs a ${finalApprovedHours} hrs por el Jefe Directo.`
      : `Tus horas extras del ${new Date(record.start_date_time).toLocaleDateString()} (${finalApprovedHours} hrs) fueron pre-aprobadas por el Jefe Directo y pasaron a RRHH.`;

    await executeWrite(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [record.user_id, notifTitle, notifMsg, isModified ? 'OVERTIME_MODIFIED' : 'OVERTIME_APPROVED']
    );

    const updatedRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    return res.json({ message: 'Horas extras pre-aprobadas por el Jefe Directo. Notificación enviada al empleado.', record: updatedRows[0] });
  } catch (error) {
    console.error('Error al aprobar por área:', error);
    return res.status(500).json({ error: 'Error al procesar la aprobación.' });
  }
};

export const approveByRRHH = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rrhhNotes, approvedHoursCount } = req.body;
    const reviewerId = req.user!.id;

    const recordRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    if (recordRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }
    const record = recordRows[0];

    const finalApprovedHours = approvedHoursCount
      ? parseFloat(approvedHoursCount)
      : Number(record.approved_hours_count || record.hours_count);

    await executeWrite(
      `UPDATE overtime_records
       SET status = 'APROBADO', reviewed_by_rrhh = ?, rrhh_notes = ?, approved_hours_count = ?
       WHERE id = ?`,
      [reviewerId, rrhhNotes || 'Autorizado totalmente para pago en nómina por RRHH', finalApprovedHours, id]
    );

    await executeWrite(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'OVERTIME_APPROVED')`,
      [
        record.user_id,
        '¡Horas Extras Aprobadas por RRHH!',
        `Tus horas extras (${finalApprovedHours} hrs) han sido autorizadas totalmente por Recursos Humanos.`,
      ]
    );

    const updatedRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    return res.json({ message: 'Horas extras APROBADAS en su totalidad por RRHH.', record: updatedRows[0] });
  } catch (error) {
    console.error('Error al aprobar por RRHH:', error);
    return res.status(500).json({ error: 'Error al procesar aprobación.' });
  }
};

export const rejectOvertime = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const roleCode = req.user!.roleCode;

    const recordRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    if (recordRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    const record = recordRows[0];

    const updateField = roleCode === 'PRODUCCION' ? 'area_boss_notes' : 'rrhh_notes';
    await executeWrite(
      `UPDATE overtime_records SET status = 'RECHAZADO', ${updateField} = ? WHERE id = ?`,
      [rejectionReason || 'No cumple con los criterios requeridos', id]
    );

    await executeWrite(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'OVERTIME_REJECTED')`,
      [
        record.user_id,
        'Horas Extras Rechazadas',
        `Tus horas extras del ${new Date(record.start_date_time).toLocaleDateString()} fueron rechazadas. Motivo: ${rejectionReason || 'No justificado'}.`,
      ]
    );

    const updatedRows = await queryRows<RowDataPacket>(`SELECT * FROM overtime_records WHERE id = ?`, [id]);
    return res.json({ message: 'Horas extras RECHAZADAS. Se notificó al empleado.', record: updatedRows[0] });
  } catch (error) {
    console.error('Error al rechazar horas extras:', error);
    return res.status(500).json({ error: 'Error al rechazar registro.' });
  }
};
