import express from 'express';
import { getProjectOverview, getDashboardAnalytics } from '../controllers/dashboard-analytics.controller';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get project dashboard overview with summary metrics
router.get('/projects/:projectId/overview', getProjectOverview);

// Get dashboard analytics including metrics about tiles and data models
router.get('/dashboards/:dashboardId/analytics', getDashboardAnalytics);

export default router;
