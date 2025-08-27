// SmartChoice AI - Ultra Simple Railway Version
// Maximum compatibility, minimum complexity

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check - Railway needs this
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    message: 'SmartChoice AI is running!'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SmartChoice AI',
    status: 'running',
    port: PORT,
    endpoints: ['/health', '/'],
    message: 'Ultra simple Railway version'
  });
});

// Start server - Railway specific
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SmartChoice AI Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🛤️ Platform: Railway`);
  console.log(`✅ Ready for Railway deployment!`);
});

export default app;
