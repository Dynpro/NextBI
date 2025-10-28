import express from 'express';
import { executeAnalyticsQuery, calculateKpiMetrics } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Execute analytics query for dashboard visualizations
router.post('/query/:dataModelId', executeAnalyticsQuery);

// Calculate KPI metrics 
router.post('/kpi/:dataModelId', calculateKpiMetrics);

export default router;
