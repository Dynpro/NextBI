import sequelize from '../config/database';
import User from './User';
import Project from './Project';
import ProjectUser from './ProjectUser';
import Folder from './Folder';
import Dashboard from './Dashboard';
import Tile from './Tile';
import TextRow from './TextRow';
import DatabaseConnection from './DatabaseConnection';
import DataModel from './DataModel';

// Define associations between models
const setupAssociations = (): void => {
  const models = {
    User,
    Project,
    ProjectUser,
    Folder,
    Dashboard,
    Tile,
    TextRow,
    DatabaseConnection,
    DataModel
  };
  
  // Call associate method on each model if it exists
  Object.keys(models).forEach(modelName => {
    if ((models as any)[modelName].associate) {
      (models as any)[modelName].associate(models);
    }
  });
};

// Setup associations
setupAssociations();

// Export models
export {
  sequelize,
  User,
  Project,
  ProjectUser,
  Folder,
  Dashboard,
  Tile,
  TextRow,
  DatabaseConnection,
  DataModel
};

export default {
  sequelize,
  User,
  Project,
  ProjectUser,
  Folder,
  Dashboard,
  Tile,
  TextRow,
  DatabaseConnection,
  DataModel
};
