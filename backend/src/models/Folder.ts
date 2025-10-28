import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Folder attributes interface
interface FolderAttributes {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for folder creation
interface FolderCreationAttributes extends Optional<FolderAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

// Folder model class definition
class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public projectId!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    Folder.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Folder.hasMany(models.Dashboard, { foreignKey: 'folderId', as: 'dashboards' });
  }
}

Folder.init({
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
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
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
  modelName: 'Folder',
  tableName: 'folders',
  timestamps: true
});

export default Folder;
