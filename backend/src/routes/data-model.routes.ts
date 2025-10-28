import { Router } from 'express';
import { 
  createDataModel,
  getAllDataModels,
  getDataModelById,
  updateDataModel,
  deleteDataModel,
  getDatabaseSchema,
  executeQuery
} from '../controllers/data-model.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Data model routes
router.post('/', createDataModel);
router.get('/', getAllDataModels);
router.get('/:id', getDataModelById);
router.put('/:id', updateDataModel);
router.delete('/:id', deleteDataModel);

// Schema and query execution routes
router.get('/connection/:connectionId/schema', getDatabaseSchema);
router.post('/:id/execute', executeQuery);

export default router;
