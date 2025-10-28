import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Tile attributes interface
interface TileAttributes {
  id: string;
  title: string;
  type: 'chart' | 'text' | 'kpi';
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  content: Record<string, unknown>; // JSON content (chart data, text content, etc.)
  position: Record<string, unknown>; // x, y, w, h coordinates
  styling: Record<string, unknown>; // colors, fonts, etc.
  dataModelId?: string; // Reference to data model if applicable
  dashboardId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for tile creation
interface TileCreationAttributes extends Optional<TileAttributes, 'id' | 'chartType' | 'dataModelId' | 'createdAt' | 'updatedAt'> {}

// Tile model class definition
class Tile extends Model<TileAttributes, TileCreationAttributes> implements TileAttributes {
  public id!: string;
  public title!: string;
  public type!: 'chart' | 'text' | 'kpi';
  public chartType?: 'bar' | 'line' | 'pie' | 'donut';
  public content!: Record<string, unknown>;
  public position!: Record<string, unknown>;
  public styling!: Record<string, unknown>;
  public dataModelId?: string;
  public dashboardId!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    Tile.belongsTo(models.Dashboard, { foreignKey: 'dashboardId', as: 'dashboard' });
    Tile.belongsTo(models.DataModel, { foreignKey: 'dataModelId', as: 'dataModel' });
  }
}

Tile.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('chart', 'text', 'kpi'),
    allowNull: false
  },
  chartType: {
    type: DataTypes.ENUM('bar', 'line', 'pie', 'donut'),
    allowNull: true
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  position: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { x: 0, y: 0, w: 6, h: 6 }
  },
  styling: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { 
      backgroundColor: '#ffffff', 
      textColor: '#333333',
      chartColors: ['#40c0a0', '#2060e0', '#e04060'] 
    }
  },
  dataModelId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'data_models',
      key: 'id'
    }
  },
  dashboardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'dashboards',
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
  modelName: 'Tile',
  tableName: 'tiles',
  timestamps: true
});

export default Tile;
