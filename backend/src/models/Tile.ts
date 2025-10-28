import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Tile attributes interface
interface TileAttributes {
  id: string;
  title: string;
  type: 'Text & Query' | 'Pie Chart'; // Updated to remove Table
  connectionId: string; // Database connection ID (mandatory)
  content: Record<string, unknown>; // JSON content (text rows, table config, query results)
  position: Record<string, unknown>; // x, y, w, h coordinates
  styling: Record<string, unknown>; // colors, fonts, etc.
  dashboardId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for tile creation
interface TileCreationAttributes extends Optional<TileAttributes, 'id' | 'content' | 'position' | 'styling' | 'createdAt' | 'updatedAt'> {}

// Tile model class definition
class Tile extends Model<TileAttributes, TileCreationAttributes> implements TileAttributes {
  public id!: string;
  public title!: string;
  public type!: 'Text & Query' | 'Pie Chart';
  public connectionId!: string;
  public content!: Record<string, unknown>;
  public position!: Record<string, unknown>;
  public styling!: Record<string, unknown>;
  public dashboardId!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    Tile.belongsTo(models.Dashboard, { foreignKey: 'dashboardId', as: 'dashboard' });
    Tile.belongsTo(models.DatabaseConnection, { foreignKey: 'connectionId', as: 'connection' });
    Tile.hasMany(models.TextRow, { foreignKey: 'tileId', as: 'textRows' });
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
    type: DataTypes.ENUM('Text & Query', 'Pie Chart'),
    allowNull: false
  },
  connectionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'database_connections',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      textRows: [], // For Text & Query tiles
      tableConfig: {
        selectedTable: '',
        columns: []
      } // For Table tiles
    }
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
      textColor: '#333333'
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
