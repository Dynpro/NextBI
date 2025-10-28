import { Router } from 'express';
import { 
  createTile,
  getTileById,
  updateTile,
  updateTilePosition,
  deleteTile,
  getDashboardTiles
} from '../controllers/tile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tile routes - following the new URL structure
// POST /tile - Create new tile
router.post('/', createTile);

// GET /tile/{tileId} - Get specific tile
router.get('/:tileId', getTileById);

// PUT /tile/{tileId} - Update specific tile
router.put('/:tileId', updateTile);

// DELETE /tile/{tileId} - Delete specific tile
router.delete('/:tileId', deleteTile);

// Special route for position updates - keeping this functionality
router.put('/:tileId/position', updateTilePosition);

// Get tiles by dashboard - keeping for compatibility
router.get('/by-dashboard/:dashboardId', getDashboardTiles);

export default router;
