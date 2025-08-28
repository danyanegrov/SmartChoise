// Simple test version for Railway deployment
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Simple Test Version...');
console.log('🔌 Server will listen on port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🛤️ Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'false');

// Basic CORS
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    message: 'Simple test version is running!',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  res.json({
    name: 'SmartChoice AI - Test Version',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    message: 'Simple test version is working!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
