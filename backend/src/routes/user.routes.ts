import express from 'express';
import { searchUsers, getUserById, updateProfile } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Search for users by email or name
router.get('/search', searchUsers);

// Get user by ID
router.get('/:id', getUserById);

// Update current user profile
router.put('/profile', updateProfile);

export default router;
