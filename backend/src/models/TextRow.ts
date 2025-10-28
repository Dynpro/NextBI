import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// TextRow attributes interface
interface TextRowAttributes {
  id: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
  tileId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attributes for text row creation
interface TextRowCreationAttributes extends Optional<TextRowAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// TextRow model class definition
class TextRow extends Model<TextRowAttributes, TextRowCreationAttributes> implements TextRowAttributes {
  public id!: string;
  public type!: 'header' | 'subheader' | 'text';
  public content!: string;
  public isQuery!: boolean;
  public tileId!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Define associations
  static associate(models: any) {
    TextRow.belongsTo(models.Tile, { foreignKey: 'tileId', as: 'tile' });
  }
}

TextRow.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('header', 'subheader', 'text'),
    allowNull: false,
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  isQuery: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tiles',
      key: 'id'
    },
    onDelete: 'CASCADE' // When a tile is deleted, also delete associated text rows
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
  modelName: 'TextRow',
  tableName: 'text_rows',
  timestamps: true
});

export default TextRow;
