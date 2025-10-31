import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Dashboard attributes interface
interface DashboardAttributes {
  id: string;
  name: string;
  description?: string;
  folderId: string;
  layout?: Record<string, unknown>; // Store layout configuration as JSON
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for dashboard creation
interface DashboardCreationAttributes extends Optional<DashboardAttributes, 'id' | 'description' | 'layout' | 'createdAt' | 'updatedAt'> {}

// Dashboard model class definition
class Dashboard extends Model<DashboardAttributes, DashboardCreationAttributes> implements DashboardAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public folderId!: string;
  public layout?: Record<string, unknown>;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    Dashboard.belongsTo(models.Folder, { foreignKey: 'folderId', as: 'folder' });
    Dashboard.hasMany(models.Tile, { foreignKey: 'dashboardId', as: 'tiles' });
  }
}

Dashboard.init({
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
  folderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'folders',
      key: 'id'
    }
  },
  layout: {
    type: DataTypes.JSONB,
    allowNull: true
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
  modelName: 'Dashboard',
  tableName: 'dashboards',
  timestamps: true
});

export default Dashboard;
