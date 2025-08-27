import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.js';

let prisma;

// Initialize Prisma Client with proper error handling
try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
  // In development, use global to avoid exhausting database connections
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log database queries in development
    global.prisma.$on('query', (e) => {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Params: ${e.params}`);
      logger.debug(`Duration: ${e.duration}ms`);
    });

    global.prisma.$on('error', (e) => {
      logger.error('Database error:', e);
    });
  }
  prisma = global.prisma;
  }
} catch (error) {
  logger.error('❌ Failed to initialize Prisma client:', error.message);
  logger.warn('⚠️ Running without Prisma database connection - CSV database will still work');
  prisma = null;
}

// Test database connection
async function connectToDatabase() {
  try {
    if (!prisma) {
      logger.warn('⚠️ Prisma client not initialized - skipping database connection');
      return;
    }
    
    await prisma.$connect();
    logger.info('✅ Connected to database');
    
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection test successful');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    logger.warn('⚠️ Application will continue without Prisma database');
  }
}

// Graceful shutdown
async function disconnectFromDatabase() {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('✅ Disconnected from database');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from database:', error);
  }
}

// Initialize connection
connectToDatabase();

// Handle process termination
process.on('beforeExit', disconnectFromDatabase);
process.on('SIGINT', disconnectFromDatabase);
process.on('SIGTERM', disconnectFromDatabase);

export { prisma };
export default prisma;
