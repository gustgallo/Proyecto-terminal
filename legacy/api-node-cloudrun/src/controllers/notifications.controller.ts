import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import type { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket {
  unread_count: number;
}

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const notifications = await queryRows<RowDataPacket>(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const unreadRows = await queryRows<CountRow>(
      `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.json({
      notifications,
      unreadCount: Number(unreadRows[0]?.unread_count || 0),
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error al consultar notificaciones.' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await executeWrite(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return res.status(500).json({ error: 'Error al actualizar.' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await executeWrite(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
    return res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return res.status(500).json({ error: 'Error al actualizar.' });
  }
};
