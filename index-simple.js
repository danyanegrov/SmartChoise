// SmartChoice AI - Railway Entry Point (Simple Mode - CSV Only)
// This version runs without Prisma for Railway deployment

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './src/routes/auth.js';
import decisionsRoutes from './src/routes/decisions.js';
import mlRoutes from './src/routes/ml.js';
import analyticsRoutes from './src/routes/analytics.js';
import userRoutes from './src/routes/users.js';
import databaseRoutes from './src/routes/database.js';
import perplexityRoutes from './src/routes/perplexity.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/services/logger.js';

// Import services
import { logger } from './src/services/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for Railway
const corsOptions = {
  origin: function (origin, callback) {
    // Allow Railway deployment URLs and local development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.railway\.com$/
    ];
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    mode: 'CSV-only (no Prisma)',
    database: 'CSV files'
  });
});

// API Routes (without auth middleware for CSV-only mode)
app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/perplexity', perplexityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const isRailway = process.env.RAILWAY_ENVIRONMENT;
  const baseUrl = isRailway ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'unknown'}` : `http://localhost:${PORT}`;
  
  logger.info(`🚀 SmartChoice AI Server running on port ${PORT}`);
  logger.info(`📊 Health check: ${baseUrl}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🛤️ Platform: ${isRailway ? 'Railway' : 'Local'}`);
  logger.info(`🗄️ Database Mode: CSV-only (no Prisma)`);
  
  if (isRailway) {
    logger.info(`🌐 Public URL: ${baseUrl}`);
    logger.info(`🗄️ Database: CSV files loaded`);
    logger.info(`🤖 Perplexity AI: Integrated`);
  }
});

export default app;
