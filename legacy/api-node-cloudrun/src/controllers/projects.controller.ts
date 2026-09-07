import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const projectSchema = z.object({
  code: z.string().min(3, 'Código de proyecto requerido'),
  name: z.string().min(3, 'Nombre de proyecto requerido'),
  clientName: z.string().min(2, 'Nombre de cliente requerido'),
  sector: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PLANIFICACION', 'EN_PROCESO', 'INSTALACION', 'COMPLETADO', 'MANTENIMIENTO']).default('PLANIFICACION'),
  startDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
});

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const rows = await queryRows<RowDataPacket>(
      `SELECT p.*, CONCAT_WS(' ', u.first_name, u.last_name) AS creator_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );
    return res.json({ projects: rows });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return res.status(500).json({ error: 'Error al consultar proyectos.' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = projectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de proyecto inválidos', details: parseResult.error.format() });
    }

    const { code, name, clientName, sector, description, status, startDate, estimatedEndDate } = parseResult.data;
    const createdBy = req.user!.id;

    const insert = await executeWrite(
      `INSERT INTO projects (code, name, client_name, sector, description, status, start_date, estimated_end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, clientName, sector || null, description || null, status, startDate || null, estimatedEndDate || null, createdBy]
    );

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM projects WHERE id = ?`, [insert.insertId]);
    return res.status(201).json({ message: 'Proyecto creado exitosamente.', project: rows[0] });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return res.status(500).json({ error: 'Error al registrar proyecto.' });
  }
};
