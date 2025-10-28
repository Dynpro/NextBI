import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

// User attributes interface
interface UserAttributes {
  id: string;
  email: string;
  displayName: string;
  azureId?: string;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for user creation
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// User model class definition
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public displayName!: string;
  public azureId?: string;
  public avatar?: string;
  public lastLogin?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    User.hasMany(models.Project, { foreignKey: 'creatorId', as: 'createdProjects' });
    User.belongsToMany(models.Project, { 
      through: models.ProjectUser,
      foreignKey: 'userId',
      as: 'projects' 
    });
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  azureId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
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
  modelName: 'User',
  tableName: 'users',
  timestamps: true
});

export default User;
