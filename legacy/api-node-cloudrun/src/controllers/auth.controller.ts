import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryRows } from '../config/db.js';
import { z } from 'zod';
import { env } from '../config/env.js';
import type { RowDataPacket } from 'mysql2';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  department: string | null;
  is_active: number | boolean;
  role_code: string | null;
  role_name: string | null;
  user_type: string | null;
}

interface PermissionRow extends RowDataPacket {
  code: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de ingreso inválidos', details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    const users = await queryRows<UserRow>(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.department, u.is_active,
              r.code AS role_code, r.name AS role_name, r.user_type
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = users[0];

    if (!Boolean(user.is_active)) {
      return res.status(403).json({ error: 'Usuario desactivado. Contacta a administración.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const permissionRows = user.role_code
      ? await queryRows<PermissionRow>(
          `SELECT p.code
           FROM permissions p
           JOIN role_permissions rp ON p.id = rp.permission_id
           JOIN roles r ON rp.role_id = r.id
           WHERE r.code = ?`,
          [user.role_code]
        )
      : [];

    const permissions = permissionRows.map((row) => row.code);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roleCode: user.role_code,
        userType: user.user_type,
        permissions,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        department: user.department,
        roleCode: user.role_code,
        roleName: user.role_name,
        userType: user.user_type,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};
