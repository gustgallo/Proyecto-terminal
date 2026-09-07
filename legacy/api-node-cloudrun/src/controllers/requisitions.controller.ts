import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { pool, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const itemSchema = z.object({
  materialName: z.string().min(2, 'Nombre de material requerido'),
  unitOfMeasure: z.string().min(1, 'Unidad requerida'),
  quantityRequested: z.number().positive('Cantidad debe ser mayor a 0'),
});

const requisitionSchema = z.object({
  projectId: z.number().positive('Proyecto requerido'),
  department: z.string().min(2, 'Departamento requerido'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Debe incluir al menos un material'),
});

export const createRequisition = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const parseResult = requisitionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de requisición inválidos', details: parseResult.error.format() });
    }

    const { projectId, department, notes, items } = parseResult.data;
    const requestedBy = req.user!.id;
    const reqCode = `REQ-${Date.now().toString().slice(-6)}`;

    await connection.beginTransaction();

    const [insertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO material_requisitions (requisition_code, project_id, requested_by, department, status, notes)
       VALUES (?, ?, ?, ?, 'ENVIADA', ?)`,
      [reqCode, projectId, requestedBy, department, notes || null]
    );

    const reqId = insertResult.insertId;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO material_requisition_items (requisition_id, material_name, unit_of_measure, quantity_requested)
         VALUES (?, ?, ?, ?)`,
        [reqId, item.materialName, item.unitOfMeasure, item.quantityRequested]
      );
    }

    const [headerRows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM material_requisitions WHERE id = ?`,
      [reqId]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Requisición de materiales creada exitosamente',
      requisition: headerRows[0],
      itemsCount: items.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear requisición:', error);
    return res.status(500).json({ error: 'Error al procesar la requisición.' });
  } finally {
    connection.release();
  }
};

export const getRequisitions = async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await queryRows<RowDataPacket>(`
      SELECT mr.*, 
             CONCAT_WS(' ', u.first_name, u.last_name) AS requested_by_name,
             p.name AS project_name, p.code AS project_code,
             (SELECT COUNT(*) FROM material_requisition_items mri WHERE mri.requisition_id = mr.id) AS total_items
      FROM material_requisitions mr
      JOIN users u ON mr.requested_by = u.id
      JOIN projects p ON mr.project_id = p.id
      ORDER BY mr.created_at DESC
    `);

    return res.json({ requisitions: rows });
  } catch (error) {
    console.error('Error al obtener requisiciones:', error);
    return res.status(500).json({ error: 'Error al consultar requisiciones.' });
  }
};

export const getRequisitionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const headerRows = await queryRows<RowDataPacket>(
      `SELECT mr.*, CONCAT_WS(' ', u.first_name, u.last_name) AS requested_by_name, p.name AS project_name
       FROM material_requisitions mr
       JOIN users u ON mr.requested_by = u.id
       JOIN projects p ON mr.project_id = p.id
       WHERE mr.id = ?`,
      [id]
    );

    if (headerRows.length === 0) {
      return res.status(404).json({ error: 'Requisición no encontrada' });
    }

    const itemRows = await queryRows<RowDataPacket>(
      `SELECT * FROM material_requisition_items WHERE requisition_id = ?`,
      [id]
    );

    return res.json({
      requisition: headerRows[0],
      items: itemRows,
    });
  } catch (error) {
    console.error('Error al obtener detalle de requisición:', error);
    return res.status(500).json({ error: 'Error al obtener detalle.' });
  }
};
