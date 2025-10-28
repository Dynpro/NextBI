import { Router } from 'express';
import { 
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addUserToProject,
  removeUserFromProject,
  getProjectUsers
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { Project, ProjectUser, User, Folder } from '../models';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes - following the new URL structure
// POST /project - Create new project
router.post('/', createProject);

// GET /projects - Get all projects (for sidebar)
router.get('/all', getUserProjects);

// GET /project/{projectId} - Get specific project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you don\'t have access'
      });
      return;
    }
    
    // Get project with creator info
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'displayName', 'email', 'avatar']
        },
        {
          model: Folder,
          as: 'folders'
        }
      ]
    });
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Add role information
    const projectWithRole = {
      ...project.toJSON(),
      role: projectUser.role
    };
    
    res.status(200).json({
      success: true,
      data: projectWithRole
    });
    
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project'
    });
  }
});

// PUT /project/{projectId} - Update specific project
router.put('/:projectId', updateProject);

// DELETE /project/{projectId} - Delete specific project
router.delete('/:projectId', deleteProject);

// Project user management routes - keeping these as they are
router.post('/:projectId/users', addUserToProject);
router.delete('/:projectId/users/:userId', removeUserFromProject);
router.get('/:projectId/users', getProjectUsers);

export default router;
