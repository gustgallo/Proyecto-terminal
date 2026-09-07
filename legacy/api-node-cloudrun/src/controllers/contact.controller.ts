import { Request, Response } from 'express';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const quoteSchema = z.object({
  fullName: z.string().min(2, 'Nombre completo requerido'),
  companyName: z.string().min(2, 'Nombre de la empresa requerido'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  solutionType: z.string().optional(),
  projectDescription: z.string().optional(),
  privacyAccepted: z.boolean().refine((val) => val === true, 'Debes aceptar el aviso de privacidad'),
});

export const submitQuote = async (req: Request, res: Response) => {
  try {
    const parseResult = quoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de cotización inválidos', details: parseResult.error.format() });
    }

    const { fullName, companyName, email, phone, solutionType, projectDescription, privacyAccepted } = parseResult.data;

    const insert = await executeWrite(
      `INSERT INTO leads_cotizaciones (full_name, company_name, email, phone, solution_type, project_description, privacy_accepted)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, companyName, email, phone || null, solutionType || 'General B2B', projectDescription || null, privacyAccepted ? 1 : 0]
    );

    const rows = await queryRows<RowDataPacket>(`SELECT * FROM leads_cotizaciones WHERE id = ?`, [insert.insertId]);

    return res.status(201).json({
      message: 'Solicitud de cotización recibida con éxito. Un ejecutivo comercial se pondrá en contacto pronto.',
      lead: rows[0],
    });
  } catch (error) {
    console.error('Error al guardar cotización:', error);
    return res.status(500).json({ error: 'Error al procesar la cotización.' });
  }
};

export const getLeads = async (_req: Request, res: Response) => {
  try {
    const rows = await queryRows<RowDataPacket>(`SELECT * FROM leads_cotizaciones ORDER BY created_at DESC`);
    return res.json({ leads: rows });
  } catch (error) {
    console.error('Error al obtener leads:', error);
    return res.status(500).json({ error: 'Error al obtener solicitudes.' });
  }
};
