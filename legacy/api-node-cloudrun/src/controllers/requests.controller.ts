import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const internalRequestSchema = z.object({
  requestType: z.enum(['VACACIONES', 'PERMISO', 'AUSENCIA']),
  startDate: z.string().min(10, 'Fecha inicio requerida'),
  endDate: z.string().min(10, 'Fecha fin requerida'),
  reason: z.string().min(5, 'Justificación requerida'),
});

export const createInternalRequest = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = internalRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de solicitud inválidos', details: parseResult.error.format() });
    }

    const { requestType, startDate, endDate, reason } = parseResult.data;
    const userId = req.user!.id;

    const insert = await executeWrite(
      `INSERT INTO internal_requests (user_id, request_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE_JEFE')`,
      [userId, requestType, startDate, endDate, reason]
    );

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM internal_requests WHERE id = ?`, [insert.insertId]);
    return res.status(201).json({ message: 'Solicitud enviada a revisión.', request: rows[0] });
  } catch (error) {
    console.error('Error al crear solicitud interna:', error);
    return res.status(500).json({ error: 'Error al enviar solicitud.' });
  }
};

export const getInternalRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { roleCode, id: currentUserId } = req.user!;

    let query = `
      SELECT ir.*, CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name, u.department
      FROM internal_requests ir
      JOIN users u ON ir.user_id = u.id
    `;
    const params: unknown[] = [];

    if (roleCode !== 'ADMIN_GLOBAL' && roleCode !== 'ADMIN_RRHH') {
      query += ` WHERE ir.user_id = ?`;
      params.push(currentUserId);
    }

    query += ` ORDER BY ir.created_at DESC`;

    const rows = await queryRows<RowDataPacket>(query, params);
    return res.json({ requests: rows });
  } catch (error) {
    console.error('Error al obtener solicitudes internas:', error);
    return res.status(500).json({ error: 'Error al consultar solicitudes.' });
  }
};

export const approveInternalRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user!.id;

    const update = await executeWrite(
      `UPDATE internal_requests SET status = 'APROBADO', approved_by = ? WHERE id = ?`,
      [approverId, id]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM internal_requests WHERE id = ?`, [id]);
    return res.json({ message: 'Solicitud aprobada exitosamente', request: rows[0] });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    return res.status(500).json({ error: 'Error al procesar aprobación.' });
  }
};
