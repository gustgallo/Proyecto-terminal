import { Router } from 'express';
import { createOvertime, getOvertimeRecords, approveByArea, approveByRRHH, rejectOvertime } from '../controllers/overtime.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createOvertime);
router.get('/', getOvertimeRecords);
router.patch('/:id/approve-area', requireRole(['ADMIN_GLOBAL', 'PRODUCCION']), approveByArea);
router.patch('/:id/approve-rrhh', requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH']), approveByRRHH);
router.patch('/:id/reject', requireRole(['ADMIN_GLOBAL', 'ADMIN_RRHH', 'PRODUCCION']), rejectOvertime);

export default router;
