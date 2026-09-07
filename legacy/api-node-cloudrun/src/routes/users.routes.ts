import { Router } from 'express';
import { getUsers, createUser, toggleUserStatus } from '../controllers/users.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.get('/', requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH']), getUsers);
router.post('/', requireRole(['ADMIN_GLOBAL']), createUser);
router.patch('/:id/toggle-status', requireRole(['ADMIN_GLOBAL']), toggleUserStatus);

export default router;
