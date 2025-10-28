import { Model, Optional, FindOptions, WhereOptions, Includeable, InferAttributes, InferCreationAttributes } from 'sequelize';

// Project model type definition
export interface ProjectAttributes {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface ProjectInstance extends Model<ProjectAttributes, ProjectCreationAttributes>, ProjectAttributes {}

// Folder model type definition
export interface FolderAttributes {
  id: string;
  name: string;
  projectId: string;
  dashboards?: Array<DashboardInstance>; // Add dashboards array
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FolderCreationAttributes extends Optional<FolderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface FolderInstance extends Model<FolderAttributes, FolderCreationAttributes>, FolderAttributes {}

// Dashboard model type definition
export interface DashboardAttributes {
  id: string;
  name: string;
  description?: string;
  folderId: string;
  projectId: string; // Adding missing projectId field
  layout?: object;
  tiles?: Array<object>; // Add tiles array to match the usage in controllers
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DashboardCreationAttributes extends Optional<DashboardAttributes, 'id' | 'description' | 'layout' | 'createdAt' | 'updatedAt'> {}

export interface DashboardInstance extends Model<DashboardAttributes, DashboardCreationAttributes>, DashboardAttributes {
  folder?: FolderInstance;
  // We also need to define folder.name access pattern
  getFolderName?: () => Promise<string>;
}

// Tile model type definition
export interface TileAttributes {
  id: string;
  title: string;
  type: string;
  dashboardId: string;
  dataModelId?: string;
  chartType?: string;
  query?: string;
  config?: object;
  position?: object;
  size?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TileCreationAttributes extends Optional<TileAttributes, 'id' | 'chartType' | 'query' | 'config' | 'position' | 'size' | 'createdAt' | 'updatedAt'> {}

export interface TileInstance extends Model<TileAttributes, TileCreationAttributes>, TileAttributes {
  dataModel?: DataModelInstance;
}

// DataModel model type definition
export interface DataModelAttributes {
  id: string;
  name: string;
  description?: string;
  connectionId: string;
  schema: Record<string, unknown>;
  query?: string;
  refreshSchedule?: string;
  lastRefreshedAt?: Date;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DataModelCreationAttributes extends Optional<DataModelAttributes, 'id' | 'schema' | 'columns' | 'createdAt' | 'updatedAt'> {}

export interface DataModelInstance extends Model<DataModelAttributes, DataModelCreationAttributes>, DataModelAttributes {
  connection?: DatabaseConnectionInstance;
  project?: ProjectInstance;
}

// DatabaseConnection model type definition
export interface DatabaseConnectionAttributes {
  id: string;
  name: string;
  projectId: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DatabaseConnectionCreationAttributes extends Optional<DatabaseConnectionAttributes, 'id' | 'ssl' | 'createdAt' | 'updatedAt'> {}

export interface DatabaseConnectionInstance extends Model<DatabaseConnectionAttributes, DatabaseConnectionCreationAttributes>, DatabaseConnectionAttributes {}

// ProjectUser model type definition
export interface ProjectUserAttributes {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectUserCreationAttributes extends Optional<ProjectUserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface ProjectUserInstance extends Model<ProjectUserAttributes, ProjectUserCreationAttributes>, ProjectUserAttributes {
  user?: UserInstance;
}

// User model type definition
export interface UserAttributes {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  azureId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatarUrl' | 'azureId' | 'createdAt' | 'updatedAt'> {}

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

// Declare module augmentation for model static methods
declare module '../models' {
  interface Project extends Model<ProjectAttributes, ProjectCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<ProjectInstance | null>;
    findOne: (options: FindOptions) => Promise<ProjectInstance | null>;
    findAll: (options?: FindOptions) => Promise<ProjectInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface Folder extends Model<FolderAttributes, FolderCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<FolderInstance | null>;
    findOne: (options: FindOptions) => Promise<FolderInstance | null>;
    findAll: (options?: FindOptions) => Promise<FolderInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface Dashboard extends Model<DashboardAttributes, DashboardCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<DashboardInstance | null>;
    findOne: (options: FindOptions) => Promise<DashboardInstance | null>;
    findAll: (options?: FindOptions) => Promise<DashboardInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface Tile extends Model<TileAttributes, TileCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<TileInstance | null>;
    findOne: (options: FindOptions) => Promise<TileInstance | null>;
    findAll: (options?: FindOptions) => Promise<TileInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface DataModel extends Model<DataModelAttributes, DataModelCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<DataModelInstance | null>;
    findOne: (options: FindOptions) => Promise<DataModelInstance | null>;
    findAll: (options?: FindOptions) => Promise<DataModelInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface DatabaseConnection extends Model<DatabaseConnectionAttributes, DatabaseConnectionCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<DatabaseConnectionInstance | null>;
    findOne: (options: FindOptions) => Promise<DatabaseConnectionInstance | null>;
    findAll: (options?: FindOptions) => Promise<DatabaseConnectionInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface ProjectUser extends Model<ProjectUserAttributes, ProjectUserCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<ProjectUserInstance | null>;
    findOne: (options: FindOptions) => Promise<ProjectUserInstance | null>;
    findAll: (options?: FindOptions) => Promise<ProjectUserInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }

  interface User extends Model<UserAttributes, UserCreationAttributes> {
    findByPk: (id: string, options?: FindOptions) => Promise<UserInstance | null>;
    findOne: (options: FindOptions) => Promise<UserInstance | null>;
    findAll: (options?: FindOptions) => Promise<UserInstance[]>;
    count: (options?: FindOptions) => Promise<number>;
  }
}
