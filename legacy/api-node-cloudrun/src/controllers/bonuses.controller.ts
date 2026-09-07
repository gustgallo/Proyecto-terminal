import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const createBonusSchema = z.object({
  userId: z.number().positive('Usuario requerido'),
  projectId: z.number().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  reason: z.string().min(5, 'Razón requerida'),
  bonusDate: z.string().optional(),
});

export const createBonus = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createBonusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de bonificación inválidos', details: parseResult.error.format() });
    }

    const { userId, projectId, amount, reason, bonusDate } = parseResult.data;
    const assignedBy = req.user!.id;

    const insert = await executeWrite(
      `INSERT INTO bonuses (user_id, project_id, amount, reason, bonus_date, status, assigned_by)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
      [userId, projectId || null, amount, reason, bonusDate || new Date().toISOString().split('T')[0], assignedBy]
    );

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM bonuses WHERE id = ?`, [insert.insertId]);
    return res.status(201).json({ message: 'Bonificación asignada exitosamente.', bonus: rows[0] });
  } catch (error) {
    console.error('Error al asignar bono:', error);
    return res.status(500).json({ error: 'Error al asignar bonificación.' });
  }
};

export const getBonuses = async (req: AuthRequest, res: Response) => {
  try {
    const { roleCode, id: currentUserId } = req.user!;

    let query = `
      SELECT b.*, 
             CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name, u.email AS employee_email,
             p.name AS project_name, p.code AS project_code,
             CONCAT_WS(' ', ab.first_name, ab.last_name) AS assigned_by_name
      FROM bonuses b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN users ab ON b.assigned_by = ab.id
    `;
    const params: unknown[] = [];

    if (roleCode !== 'ADMIN_GLOBAL' && roleCode !== 'ADMIN_RRHH') {
      query += ` WHERE b.user_id = ?`;
      params.push(currentUserId);
    }

    query += ` ORDER BY b.created_at DESC`;

    const rows = await queryRows<RowDataPacket>(query, params);
    return res.json({ bonuses: rows });
  } catch (error) {
    console.error('Error al consultar bonos:', error);
    return res.status(500).json({ error: 'Error al consultar bonificaciones.' });
  }
};
