import { Router } from 'express';
import { createRequisition, getRequisitions, getRequisitionDetails } from '../controllers/requisitions.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post('/', createRequisition);
router.get('/', getRequisitions);
router.get('/:id', getRequisitionDetails);

export default router;
