import { Router } from 'express';
import { createInternalRequest, getInternalRequests, approveInternalRequest } from '../controllers/requests.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post('/', createInternalRequest);
router.get('/', getInternalRequests);
router.patch('/:id/approve', requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH']), approveInternalRequest);

export default router;
