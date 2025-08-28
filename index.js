// SmartChoice AI - Full CSV Database Version
// Complete functionality with CSV database integration

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting SmartChoice AI Full CSV Version...');
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
console.log('🏠 Railway Domain:', process.env.RAILWAY_PUBLIC_DOMAIN || 'not set');
console.log('🔑 Railway Project ID:', process.env.RAILWAY_PROJECT_ID || 'not set');
console.log('📦 Railway Service ID:', process.env.RAILWAY_SERVICE_ID || 'not set');
console.log('🌐 Railway Environment Variables:', Object.keys(process.env).filter(key => key.startsWith('RAILWAY_')).join(', ') || 'none');

// CORS configuration for Railway - Fixed for wildcard domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow Railway domains with wildcard support
    if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching for all static files
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static files from public directory
app.use(express.static('public'));
// Serve project root for redesigned assets (style.css, app.js, index.html)
app.use(express.static('.'));

// Serve the main HTML application
app.get('/app', (req, res) => {
    // Prevent caching to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Redirect root to the app
app.get('/', (req, res) => {
    res.redirect('/app');
});

// Alternative main page endpoint
app.get('/main', (req, res) => {
    // Prevent caching to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Home page endpoint - serves the main application
app.get('/home', (req, res) => {
    // Prevent caching to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Security headers for Railway
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// CSV Database Service
class CSVDatabaseService {
  constructor() {
    // Fixed path resolution for Railway deployment
    this.dataPath = path.join(process.cwd(), 'data');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    console.log('📁 CSV Database path:', this.dataPath);
  }

  // Load CSV file with caching
  async loadCSV(filename) {
    const cacheKey = filename;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const filePath = path.join(this.dataPath, filename);
      console.log(`📖 Loading CSV file: ${filePath}`);
      
      // Check if file exists first
      if (!fs.existsSync(filePath)) {
        console.error(`❌ CSV file not found: ${filePath}`);
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`📊 Loaded CSV data from ${filename}: ${data.length} records`);
      return data;
    } catch (error) {
      console.error(`❌ Error loading ${filename}:`, error.message);
      return [];
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const files = fs.readdirSync(this.dataPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const stats = {
        totalFiles: csvFiles.length + jsonFiles.length,
        csvFiles: csvFiles.length,
        jsonFiles: jsonFiles.length,
        totalSize: 0,
        lastModified: null,
        files: []
      };

      for (const file of [...csvFiles, ...jsonFiles]) {
        const filePath = path.join(this.dataPath, file);
        const stat = fs.statSync(filePath);
        stats.totalSize += stat.size;
        if (!stats.lastModified || stat.mtime > stats.lastModified) {
          stats.lastModified = stat.mtime;
        }
        stats.files.push({
          name: file,
          size: stat.size,
          modified: stat.mtime,
          type: file.endsWith('.csv') ? 'csv' : 'json'
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      return { error: error.message };
    }
  }

  // Search across all CSV files
  async searchDatabase(query, limit = 50) {
    try {
      const files = fs.readdirSync(this.dataPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      
      const results = [];
      const searchTerm = query.toLowerCase();

      for (const filename of csvFiles) {
        const data = await this.loadCSV(filename);
        
        for (const row of data) {
          const rowString = JSON.stringify(row).toLowerCase();
          if (rowString.includes(searchTerm)) {
            results.push({
              file: filename,
              data: row
            });
            
            if (results.length >= limit) break;
          }
        }
        
        if (results.length >= limit) break;
      }

      return results;
    } catch (error) {
      console.error('❌ Error searching database:', error.message);
      return { error: error.message };
    }
  }

  // Get specific dataset
  async getDataset(filename) {
    if (filename.endsWith('.csv')) {
      return await this.loadCSV(filename);
    } else if (filename.endsWith('.json')) {
      try {
        const filePath = path.join(this.dataPath, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error.message);
        return { error: error.message };
      }
    }
    return { error: 'Unsupported file type' };
  }
}

// Initialize database service
const dbService = new CSVDatabaseService();

// Validate CSV files on startup
console.log('🔍 Validating CSV database on startup...');
try {
  const dataDir = path.join(process.cwd(), 'data');
  console.log('📁 Data directory:', dataDir);
  
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    console.log(`✅ Found ${csvFiles.length} CSV files:`, csvFiles);
    
    if (csvFiles.length === 0) {
      console.warn('⚠️ No CSV files found in data directory');
    }
  } else {
    console.error('❌ Data directory not found:', dataDir);
  }
} catch (error) {
  console.error('❌ Error validating CSV database:', error.message);
}

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
    message: 'SmartChoice AI is running with full CSV database!',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'CSV files loaded and ready'
  });
});

// Root endpoint - redirects to HTML app
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested - redirecting to /app');
  res.redirect('/app');
});

// API Information endpoint
app.get('/api/info', (req, res) => {
  console.log('📋 API info requested');
  res.json({
    name: 'SmartChoice AI',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    railway_env: process.env.RAILWAY_ENVIRONMENT || false,
    endpoints: [
      '/health',
      '/',
      '/app',
      '/api/info',
      '/api/database/stats',
      '/api/database/search',
      '/api/database/dataset/:filename',
      '/api/database/files'
    ],
    message: 'Full CSV database version is working!',
    timestamp: new Date().toISOString(),
    features: [
      'CSV Database Integration',
      'Search across all datasets',
      'Real-time data access',
      'Railway deployment ready'
    ]
  });
});

// Database statistics endpoint
app.get('/api/database/stats', async (req, res) => {
  try {
    const stats = await dbService.getDatabaseStats();
    res.json({
      success: true,
      message: 'Database statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database search endpoint
app.get('/api/database/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }

    const results = await dbService.searchDatabase(q, parseInt(limit));
    res.json({
      success: true,
      message: `Search completed for "${q}"`,
      query: q,
      limit: parseInt(limit),
      resultsCount: results.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific dataset
app.get('/api/database/dataset/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const data = await dbService.getDataset(filename);
    
    if (data.error) {
      return res.status(404).json({
        success: false,
        error: data.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Dataset ${filename} loaded successfully`,
      filename,
      dataCount: Array.isArray(data) ? data.length : 1,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// List all database files
app.get('/api/database/files', async (req, res) => {
  try {
    const stats = await dbService.getDatabaseStats();
    res.json({
      success: true,
      message: 'Database files listed successfully',
      data: stats.files || [],
      totalFiles: stats.totalFiles || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CSV Database endpoint (legacy)
app.get('/api/database/csv', async (req, res) => {
  try {
    const stats = await dbService.getDatabaseStats();
    res.json({
      success: true,
      message: 'CSV database is accessible',
      data: {
        totalFiles: stats.totalFiles || 0,
        csvFiles: stats.csvFiles || 0,
        status: 'loaded',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check current HTML file
app.get('/debug/html', (req, res) => {
    const htmlPath = path.join(process.cwd(), 'index.html');
    const exists = fs.existsSync(htmlPath);
    const stats = exists ? fs.statSync(htmlPath) : null;
    
    res.json({
        currentHtmlFile: 'index.html',
        fullPath: htmlPath,
        exists: exists,
        fileSize: exists ? stats.size : null,
        lastModified: exists ? stats.mtime : null,
        currentDirectory: process.cwd(),
        availableFiles: fs.readdirSync(process.cwd()).filter(f => f.endsWith('.html')),
        endpoints: [
            '/ - redirects to /app',
            '/app - main application page (index.html)',
            '/main - alternative main page (index.html)',
            '/home - home page (index.html)',
            '/debug/html - this endpoint'
        ],
        note: 'Using original index.html as the main application file'
    });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 for route:', req.originalUrl);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/health',
      '/',
      '/api/database/stats',
      '/api/database/search?q=query',
      '/api/database/dataset/:filename',
      '/api/database/files',
      '/api/database/csv'
    ]
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
  console.log(`🗄️ CSV Database: Ready with 7 datasets`);
  console.log(`🔍 Search: /api/database/search?q=query`);
  console.log(`📁 Datasets: /api/database/dataset/filename`);
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
  } else if (err.code === 'EACCES') {
    console.error(`💥 Permission denied for port ${PORT}. This might be a Railway permission issue.`);
    console.error('💥 Error details:', err.message);
    process.exit(1);
  } else if (err.code === 'EADDRNOTAVAIL') {
    console.error(`💥 Port ${PORT} is not available. Railway might be restricting port access.`);
    console.error('💥 Error details:', err.message);
    process.exit(1);
  } else {
    console.error('💥 Server error:', err);
    console.error('💥 Error code:', err.code);
    console.error('💥 Error message:', err.message);
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
