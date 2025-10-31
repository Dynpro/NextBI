import { Router } from 'express';
import { 
  createDashboard,
  getFolderDashboards,
  getDashboardById,
  updateDashboard,
  saveDashboardLayout,
  deleteDashboard
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard routes - following the new URL structure
// POST /dashboard - Create new dashboard
router.post('/', createDashboard);

// GET /dashboard/{dashboardId} - Get specific dashboard
router.get('/:dashboardId', getDashboardById);

// PUT /dashboard/{dashboardId} - Update specific dashboard
router.put('/:dashboardId', updateDashboard);

// DELETE /dashboard/{dashboardId} - Delete specific dashboard
router.delete('/:dashboardId', deleteDashboard);

// Special routes for layout saving - keeping this functionality
router.put('/:dashboardId/layout', saveDashboardLayout);

// Get dashboards by folder - keeping for compatibility
router.get('/by-folder/:folderId', getFolderDashboards);

export default router;
