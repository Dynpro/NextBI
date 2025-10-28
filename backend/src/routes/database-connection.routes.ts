import { Router } from 'express';
import { 
  createDatabaseConnection, 
  getAllDatabaseConnections,
  getDatabaseConnectionById,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
  getDatabaseSchema,
  getTableColumns,
  executeQuery
} from '../controllers/database-connection.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Database connection routes
router.post('/', createDatabaseConnection);
router.get('/', getAllDatabaseConnections);
router.get('/:id', getDatabaseConnectionById);
router.put('/:id', updateDatabaseConnection);
router.delete('/:id', deleteDatabaseConnection);
router.post('/:id/test', testDatabaseConnection);
router.get('/:id/schema', getDatabaseSchema);
router.get('/:id/schema/:schema/:table', getTableColumns);
router.post('/:id/query', executeQuery);

export default router;
