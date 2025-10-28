import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database';

// ProjectUser attributes interface
interface ProjectUserAttributes {
  id: string;
  projectId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

// ProjectUser model class definition
class ProjectUser extends Model<ProjectUserAttributes> implements ProjectUserAttributes {
  public id!: string;
  public projectId!: string;
  public userId!: string;
  public role!: 'admin' | 'editor' | 'viewer';
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  public static associate(models: any): void {
    ProjectUser.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
    ProjectUser.belongsTo(models.Project, { 
      foreignKey: 'projectId',
      as: 'project'
    });
  }
}

ProjectUser.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer'
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
  modelName: 'ProjectUser',
  tableName: 'project_users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'userId']
    }
  ]
});

export default ProjectUser;
