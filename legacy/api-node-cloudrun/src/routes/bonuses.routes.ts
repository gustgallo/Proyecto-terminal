import { Router } from 'express';
import { createBonus, getBonuses } from '../controllers/bonuses.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post('/', requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH']), createBonus);
router.get('/', getBonuses);

export default router;
