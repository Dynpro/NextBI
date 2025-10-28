import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import folderRoutes from './folder.routes';
import dashboardRoutes from './dashboard.routes';
import tileRoutes from './tile.routes';
import databaseConnectionRoutes from './database-connection.routes';
import dataModelRoutes from './data-model.routes';
import userRoutes from './user.routes';
import analyticsRoutes from './analytics.routes';
import dashboardAnalyticsRoutes from './dashboard-analytics.routes';
import queryRoutes from './query.routes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/project', projectRoutes);
router.use('/projects', projectRoutes); // Keep for backward compatibility
router.use('/folder', folderRoutes);
router.use('/folders', folderRoutes); // Keep for backward compatibility
router.use('/dashboard', dashboardRoutes);
router.use('/dashboards', dashboardRoutes); // Keep for backward compatibility
router.use('/tile', tileRoutes);
router.use('/tiles', tileRoutes); // Keep for backward compatibility
router.use('/connections', databaseConnectionRoutes);
router.use('/data-models', dataModelRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dashboard-analytics', dashboardAnalyticsRoutes);
router.use('/query', queryRoutes);

export default router;
