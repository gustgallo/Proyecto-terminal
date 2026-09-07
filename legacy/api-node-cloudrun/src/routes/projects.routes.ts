import { Router } from 'express';
import { getProjects, createProject } from '../controllers/projects.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getProjects);
router.post('/', authenticateToken, requireRole(['ADMIN_GLOBAL', 'PRODUCCION', 'MESA_CONTROL']), createProject);

export default router;
