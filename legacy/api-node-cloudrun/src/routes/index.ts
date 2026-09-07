import { Router } from 'express';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import overtimeRoutes from './overtime.routes.js';
import bonusesRoutes from './bonuses.routes.js';
import requisitionsRoutes from './requisitions.routes.js';
import projectsRoutes from './projects.routes.js';
import requestsRoutes from './requests.routes.js';
import chatRoutes from './chat.routes.js';
import usersRoutes from './users.routes.js';
import notificationsRoutes from './notifications.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/overtime', overtimeRoutes);
router.use('/bonuses', bonusesRoutes);
router.use('/requisitions', requisitionsRoutes);
router.use('/projects', projectsRoutes);
router.use('/requests', requestsRoutes);
router.use('/chat', chatRoutes);
router.use('/users', usersRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
