import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { executeWrite, queryRows } from '../config/db.js';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const createUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  phone: z.string().optional(),
  roleId: z.number().positive('Rol requerido'),
  department: z.string().min(2, 'Departamento requerido'),
});

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const rows = await queryRows<RowDataPacket>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.department, u.is_active, u.created_at,
              r.code AS role_code, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users: rows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ error: 'Error al consultar usuarios.' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de usuario inválidos', details: parseResult.error.format() });
    }

    const { email, password, firstName, lastName, phone, roleId, department } = parseResult.data;

    const existing = await queryRows<RowDataPacket>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insert = await executeWrite(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [email, passwordHash, firstName, lastName, phone || null, roleId, department]
    );

    const rows = await queryRows<RowDataPacket>(
      `SELECT id, email, first_name, last_name, department, is_active, created_at FROM users WHERE id = ?`,
      [insert.insertId]
    );

    return res.status(201).json({ message: 'Usuario creado exitosamente.', user: rows[0] });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = await executeWrite(
      `UPDATE users SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?`,
      [id]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const rows = await queryRows<RowDataPacket>(
      `SELECT id, email, is_active FROM users WHERE id = ?`,
      [id]
    );

    return res.json({ message: 'Estado de usuario actualizado', user: rows[0] });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    return res.status(500).json({ error: 'Error al actualizar estado.' });
  }
};
