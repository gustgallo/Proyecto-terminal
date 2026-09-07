import { Router } from 'express';
import { queryChatbot, getChatHistory } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post('/query', queryChatbot);
router.get('/history/:conversationId', getChatHistory);

export default router;
