import { Router } from 'express';
import { submitQuote, getLeads } from '../controllers/contact.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/quote', submitQuote);
router.get('/leads', authenticateToken, requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH', 'MESA_CONTROL']), getLeads);

export default router;
