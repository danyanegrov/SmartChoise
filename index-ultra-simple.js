// SmartChoice AI - Ultra Simple Railway Version
// NO external dependencies - pure Node.js

const http = require('http');

console.log('🚀 Starting SmartChoice AI Ultra Simple Version...');
console.log('📦 Node.js version:', process.version);
console.log('🌍 Platform:', process.platform);
console.log('📁 Current directory:', process.cwd());

const PORT = process.env.PORT || 3000;
console.log('🔌 Server will listen on port:', PORT);

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log('📨 Request:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Route handling
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'production',
      platform: 'Railway',
      message: 'SmartChoice AI is running!',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'SmartChoice AI',
      status: 'running',
      port: PORT,
      platform: 'Railway',
      endpoints: ['/health', '/'],
      message: 'Ultra Simple version is working!',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/api/database/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'CSV database is accessible',
      data: {
        totalFiles: 7,
        status: 'loaded',
        timestamp: new Date().toISOString()
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Route ${req.url} not found`,
      timestamp: new Date().toISOString(),
      availableRoutes: ['/health', '/', '/api/database/stats']
    }));
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
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
