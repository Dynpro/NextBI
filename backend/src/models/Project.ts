import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Project attributes interface
interface ProjectAttributes {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for project creation
interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

// Project model class definition
class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public creatorId!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    Project.belongsTo(models.User, { foreignKey: 'creatorId', as: 'creator' });
    Project.belongsToMany(models.User, { 
      through: models.ProjectUser,
      foreignKey: 'projectId',
      as: 'users' 
    });
    Project.hasMany(models.Folder, { foreignKey: 'projectId', as: 'folders' });
  }
}

Project.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Project',
  tableName: 'projects',
  timestamps: true
});

export default Project;
