import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// DatabaseConnection attributes interface
interface DatabaseConnectionAttributes {
  id: string;
  name: string;
  type: string; // postgresql, mysql, mongodb, etc.
  host: string;
  port: number;
  database: string;
  username: string;
  password: string; // Encrypted in database
  ssl: boolean;
  options?: Record<string, unknown>; // Additional connection options
  status: 'active' | 'inactive';
  lastTestedAt?: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for DatabaseConnection creation
interface DatabaseConnectionCreationAttributes extends 
  Optional<DatabaseConnectionAttributes, 'id' | 'ssl' | 'options' | 'status' | 'lastTestedAt' | 'createdAt' | 'updatedAt'> {}

// DatabaseConnection model class definition
class DatabaseConnection extends Model<DatabaseConnectionAttributes, DatabaseConnectionCreationAttributes> implements DatabaseConnectionAttributes {
  public id!: string;
  public name!: string;
  public type!: string;
  public host!: string;
  public port!: number;
  public database!: string;
  public username!: string;
  public password!: string;
  public ssl!: boolean;
  public options?: Record<string, unknown>;
  public status!: 'active' | 'inactive';
  public lastTestedAt?: Date;
  public createdById!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    DatabaseConnection.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
    DatabaseConnection.hasMany(models.DataModel, { foreignKey: 'connectionId', as: 'dataModels' });
  }
}

DatabaseConnection.init({
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
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'postgresql'
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5432
  },
  database: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ssl: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'inactive'
  },
  lastTestedAt: {
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
  modelName: 'DatabaseConnection',
  tableName: 'database_connections',
  timestamps: true,
  hooks: {
    // In a real application, you would encrypt the password before saving
    beforeSave: async (connection: DatabaseConnection) => {
      // Example encryption logic (should use proper encryption in production)
      // connection.password = encrypt(connection.password);
    }
  }
});

export default DatabaseConnection;
