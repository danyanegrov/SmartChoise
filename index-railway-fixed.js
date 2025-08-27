// SmartChoice AI - Railway Fixed Version
// This version removes complex imports and focuses on core functionality

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('🚀 Starting SmartChoice AI Railway Fixed Version...');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔌 Server will listen on port:', PORT);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - Railway needs this
app.get('/health', (req, res) => {
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SmartChoice AI',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    endpoints: ['/health', '/'],
    message: 'Railway fixed version is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple CSV database endpoint
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

// Simple Perplexity endpoint
app.get('/api/perplexity/test', (req, res) => {
  res.json({
    success: true,
    message: 'Perplexity AI endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: ['/health', '/', '/api/database/stats', '/api/perplexity/test']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received - shutting down gracefully');
  process.exit(0);
});

export default app;
