import { Sequelize } from 'sequelize';
import { env } from './env';
import logger from '../utils/logger';

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectToDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
