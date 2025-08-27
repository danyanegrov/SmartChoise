// SmartChoice AI - Railway Debug Version
// This version will show exactly what's happening during Railway deployment

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

console.log('🚀 Starting SmartChoice AI Railway Debug Version...');
console.log('📦 Node.js version:', process.version);
console.log('🌍 Platform:', process.platform);
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN
});

// Load environment variables
console.log('📝 Loading environment variables...');
dotenv.config();
console.log('✅ Environment variables loaded');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔌 Server will listen on port:', PORT);

// Basic middleware first (no complex features)
console.log('🔧 Setting up basic middleware...');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ Basic middleware configured');

// Simple health check - Railway needs this
console.log('🏥 Setting up health check endpoint...');
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    message: 'SmartChoice AI is running!',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
console.log('✅ Health check endpoint configured');

// Root endpoint
console.log('🏠 Setting up root endpoint...');
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.json({
    name: 'SmartChoice AI',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    endpoints: ['/health', '/'],
    message: 'Railway debug version is working!',
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Root endpoint configured');

// Error handling
console.log('⚠️ Setting up error handling...');
app.use('*', (req, res) => {
  console.log('❌ 404 for route:', req.originalUrl);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: ['/health', '/']
  });
});

app.use((err, req, res, next) => {
  console.error('💥 Error occurred:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Error handling configured');

// Start server - Railway specific
console.log('🚀 Starting server...');
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 ========================================');
  console.log('🎉 SmartChoice AI Server STARTED SUCCESSFULLY!');
  console.log('🎉 ========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🛤️ Platform: Railway`);
  console.log(`✅ Railway deployment successful!`);
  console.log(`🌐 Ready to receive requests!`);
  console.log('🎉 ========================================');
});

// Handle process events
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received - shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🔧 Process event handlers configured');
console.log('🎯 Server setup complete - waiting for listen callback...');

export default app;
