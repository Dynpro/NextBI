import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// DataModel attributes interface
interface DataModelAttributes {
  id: string;
  name: string;
  description?: string;
  connectionId: string; // Reference to DatabaseConnection
  schema: Record<string, unknown>; // JSON schema definition
  query?: string; // Optional custom SQL query for this model
  refreshSchedule?: string; // Optional cron expression for refresh schedule
  lastRefreshedAt?: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for DataModel creation
interface DataModelCreationAttributes extends 
  Optional<DataModelAttributes, 'id' | 'description' | 'query' | 'refreshSchedule' | 'lastRefreshedAt' | 'createdAt' | 'updatedAt'> {}

// DataModel model class definition
class DataModel extends Model<DataModelAttributes, DataModelCreationAttributes> implements DataModelAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public connectionId!: string;
  public schema!: Record<string, unknown>;
  public query?: string;
  public refreshSchedule?: string;
  public lastRefreshedAt?: Date;
  public createdById!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    DataModel.belongsTo(models.DatabaseConnection, { foreignKey: 'connectionId', as: 'connection' });
    DataModel.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
    DataModel.hasMany(models.Tile, { foreignKey: 'dataModelId', as: 'tiles' });
  }
}

DataModel.init({
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
  connectionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'database_connections',
      key: 'id'
    }
  },
  schema: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshSchedule: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      // Basic cron expression validation
      isCronExpression(value: string) {
        if (value && !/^(\*|[0-9]+|\*\/[0-9]+)(\s+(\*|[0-9]+|\*\/[0-9]+)){4,5}$/.test(value)) {
          throw new Error('Invalid cron expression format');
        }
      }
    }
  },
  lastRefreshedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdById: {
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
  modelName: 'DataModel',
  tableName: 'data_models',
  timestamps: true
});

export default DataModel;
