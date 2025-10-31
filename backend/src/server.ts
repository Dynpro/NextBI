import app from './app';
import { env } from './config/env';
import logger from './utils/logger';
import { connectToDatabase } from './config/database';
import { sequelize } from './models';

const PORT = env.PORT || '3001';

// Start the server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Sync database models (in development only)
    if (env.NODE_ENV === 'development') {
      logger.info('Syncing database models...');
      await sequelize.sync({ alter: true });
      logger.info('Database models synced successfully');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API URL: ${env.API_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server and exit process
  process.exit(1);
});

// Start the server
startServer();
