import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { executeWrite, queryRows } from '../config/db.js';
import { env } from '../config/env.js';
import type { RowDataPacket } from 'mysql2';

export const queryChatbot = async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user!.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Mensaje requerido.' });
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const insert = await executeWrite(
        `INSERT INTO chat_conversations (user_id, title) VALUES (?, ?)`,
        [userId, `Consulta RRHH ${new Date().toLocaleDateString()}`]
      );
      activeConversationId = insert.insertId;
    }

    await executeWrite(
      `INSERT INTO chat_messages (conversation_id, sender, content) VALUES (?, 'USER', ?)`,
      [activeConversationId, message]
    );

    const aiServiceUrl = env.AI_SERVICE_URL;
    let botResponseText = '';

    try {
      const response = await fetch(`${aiServiceUrl}/api/v1/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message, user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        botResponseText = data.answer || 'No se obtuvo respuesta del modelo.';
      } else {
        botResponseText = 'Servicio de IA de Prodisa en mantenimiento. Respuesta generada de contingencia: Te recordamos consultar el manual de inducción o contactar directamente al departamento de Recursos Humanos (rrhh@prodisa.com.mx).';
      }
    } catch (aiErr) {
      console.warn('Servicio de Python AI no disponible, usando fallback:', aiErr);
      botResponseText = 'Hola. De momento el motor RAG Gemini está procesando una actualización. Para trámites de vacaciones, permisos u horas extras, puedes realizarlos directamente desde el menú lateral de esta Intranet.';
    }

    const insertBot = await executeWrite(
      `INSERT INTO chat_messages (conversation_id, sender, content) VALUES (?, 'BOT', ?)`,
      [activeConversationId, botResponseText]
    );
    const botRows = await queryRows<RowDataPacket>(`SELECT * FROM chat_messages WHERE id = ?`, [insertBot.insertId]);

    return res.json({
      conversationId: activeConversationId,
      userMessage: message,
      botResponse: botRows[0],
    });
  } catch (error) {
    console.error('Error en chatbot:', error);
    return res.status(500).json({ error: 'Error interno en el asistente virtual.' });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const rows = await queryRows<RowDataPacket>(
      `SELECT cm.*
       FROM chat_messages cm
       JOIN chat_conversations cc ON cm.conversation_id = cc.id
       WHERE cc.user_id = ? AND cc.id = ?
       ORDER BY cm.created_at ASC`,
      [userId, conversationId]
    );

    return res.json({ messages: rows });
  } catch (error) {
    console.error('Error al obtener historial del chat:', error);
    return res.status(500).json({ error: 'Error al consultar historial.' });
  }
};
