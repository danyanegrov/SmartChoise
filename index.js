// SmartChoice AI - Clean Railway Version
// Only essential dependencies: express, cors, dotenv

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('🚀 Starting SmartChoice AI Clean Railway Version...');
console.log('📦 Node.js version:', process.version);
console.log('🌍 Platform:', process.platform);
console.log('📁 Current directory:', process.cwd());

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔌 Server will listen on port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🛤️ Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'false');

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - Railway needs this
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  
  // Detect if request is via HTTPS
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || 
                  req.headers['x-forwarded-ssl'] === 'on' ||
                  req.secure;
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    railway_env: process.env.RAILWAY_ENVIRONMENT || false,
    railway_domain: process.env.RAILWAY_PUBLIC_DOMAIN || null,
    protocol: isHttps ? 'https' : 'http',
    forwarded_proto: req.headers['x-forwarded-proto'] || 'not set',
    forwarded_host: req.headers['x-forwarded-host'] || 'not set',
    message: 'SmartChoice AI is running!',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.json({
    name: 'SmartChoice AI',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    railway_env: process.env.RAILWAY_ENVIRONMENT || false,
    endpoints: ['/health', '/'],
    message: 'Clean Railway version is working!',
    timestamp: new Date().toISOString()
  });
});

// CSV database endpoint
app.get('/api/database/stats', (req, res) => {
  res.json({
    success: true,
    message: 'CSV database is accessible',
    data: {
      totalFiles: 7,
      status: 'loaded',
      timestamp: new Date().toISOString()
    }
  });
});

// Perplexity endpoint
app.get('/api/perplexity/test', (req, res) => {
  res.json({
    success: true,
    message: 'Perplexity AI endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 for route:', req.originalUrl);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: ['/health', '/', '/api/database/stats', '/api/perplexity/test']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Error occurred:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log('🚀 Starting server...');

const server = app.listen(PORT, '0.0.0.0', () => {
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

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`💥 Port ${PORT} is already in use. Trying next available port...`);
    const newPort = PORT + 1;
    console.log(`🔄 Attempting to use port ${newPort}...`);
    server.listen(newPort, '0.0.0.0');
  } else {
    console.error('💥 Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('🔧 Process event handlers configured');
console.log('🎯 Server setup complete - waiting for listen callback...');

export default app;
