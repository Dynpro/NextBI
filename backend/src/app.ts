import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import logger from './utils/logger';
import { connectToDatabase } from './config/database';

// Import centralized router
import apiRoutes from './routes';

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('dev', {
  stream: {
    write: (message: string) => logger.http(message.trim())
  }
}));

// Mount API routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date(),
    environment: env.NODE_ENV
  });
});

// API documentation route - placeholder for future Swagger docs
app.get('/api/docs', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'API documentation coming soon'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { 
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
