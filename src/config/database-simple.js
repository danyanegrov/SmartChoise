// Simple database configuration without Prisma
// This is a fallback for Railway deployment
import { logger } from '../services/logger.js';

// Mock database connection for CSV-only setup
const mockPrisma = {
  $connect: async () => {
    logger.info('✅ Mock database connection (CSV mode)');
  },
  $disconnect: async () => {
    logger.info('✅ Mock database disconnected');
  },
  $queryRaw: async () => {
    logger.info('✅ Mock query executed');
    return [];
  }
};

// Test database connection
async function connectToDatabase() {
  try {
    logger.info('🗄️ Running in CSV-only mode');
    logger.info('✅ CSV database will be loaded automatically');
  } catch (error) {
    logger.error('❌ Error in database setup:', error);
  }
}

// Graceful shutdown
async function disconnectFromDatabase() {
  try {
    logger.info('✅ Database cleanup complete');
  } catch (error) {
    logger.error('❌ Error in database cleanup:', error);
  }
}

// Initialize connection
connectToDatabase();

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

export { mockPrisma as prisma, connectToDatabase, disconnectFromDatabase };
