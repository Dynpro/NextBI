import { Router } from 'express';
import { executeQuery } from '../controllers/query.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Query routes
router.post('/connections/:connectionId/execute', executeQuery);

export default router;
