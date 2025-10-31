import { Router } from 'express';
import { azureAuth, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Auth routes
router.post('/azure', azureAuth);
router.get('/me', authenticate, getCurrentUser);

export default router;
