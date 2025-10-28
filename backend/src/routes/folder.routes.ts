import { Router } from 'express';
import { 
  createFolder,
  getProjectFolders,
  getFolderById,
  updateFolder,
  deleteFolder
} from '../controllers/folder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Folder routes - following the new URL structure
// POST /folder - Create new folder
router.post('/', createFolder);

// GET /folder/{folderId} - Get specific folder
router.get('/:folderId', getFolderById);

// PUT /folder/{folderId} - Update specific folder
router.put('/:folderId', updateFolder);

// DELETE /folder/{folderId} - Delete specific folder
router.delete('/:folderId', deleteFolder);

// Get folders by project - keeping for compatibility
router.get('/by-project/:projectId', getProjectFolders);

export default router;
