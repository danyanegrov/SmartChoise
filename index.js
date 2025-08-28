// SmartChoice AI - Production Ready Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting SmartChoice AI Production Server...');
console.log('📦 Node.js version:', process.version);
console.log('🌍 Platform:', process.platform);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔌 Server will listen on port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('🛤️ Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'false');

// CORS configuration for production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Railway domains
    if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Reject other origins in production
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Cache control for static files
app.use((req, res, next) => {
  // No cache for HTML files
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Cache static assets for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Serve static files
app.use(express.static('.', {
  index: false, // Don't serve index.html automatically
  dotfiles: 'ignore',
  etag: false
}));

// CSV Database Service
class CSVDatabaseService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    console.log('📁 CSV Database path:', this.dataPath);
  }

  async loadCSV(filename) {
    const cacheKey = filename;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const filePath = path.join(this.dataPath, filename);
      
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

  async getDatabaseStats() {
    try {
      const files = fs.readdirSync(this.dataPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      
      const stats = {
        totalFiles: csvFiles.length,
        csvFiles: csvFiles.length,
        files: csvFiles,
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      return { totalFiles: 0, csvFiles: 0, files: [], error: error.message };
    }
  }

  async searchDatabase(query, limit = 50) {
    try {
      const files = fs.readdirSync(this.dataPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      const results = [];

      for (const file of csvFiles) {
        const data = await this.loadCSV(file);
        const matches = data.filter(row => 
          Object.values(row).some(value => 
            value.toString().toLowerCase().includes(query.toLowerCase())
          )
        );
        
        matches.forEach(match => {
          results.push({
            file,
            data: match
          });
        });
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('❌ Error searching database:', error.message);
      return [];
    }
  }
}

// Initialize database service
const dbService = new CSVDatabaseService();

// Main application routes
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint accessed');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.get('/app', (req, res) => {
  console.log('📱 App endpoint accessed');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.1'
  });
});

// API endpoints
app.get('/api/info', (req, res) => {
  console.log('📋 API info requested');
  res.json({
    name: 'SmartChoice AI',
    version: '1.0.1',
    status: 'running',
    port: PORT,
    platform: 'Railway',
    endpoints: [
      '/ - Main application',
      '/app - Application alias', 
      '/health - Health check',
      '/api/info - API information',
      '/api/database/stats - Database statistics',
      '/api/database/search - Search database'
    ],
    features: [
      'CSV Database Integration',
      'Decision Support System',
      'Railway Deployment Ready'
    ],
    timestamp: new Date().toISOString()
  });
});

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

// Debug endpoint
app.get('/debug/system', (req, res) => {
  const htmlPath = path.join(process.cwd(), 'index.html');
  const exists = fs.existsSync(htmlPath);
  const stats = exists ? fs.statSync(htmlPath) : null;
  
  res.json({
    system: {
      currentFile: 'index.html',
      fileExists: exists,
      fileSize: exists ? stats.size : null,
      lastModified: exists ? stats.mtime : null,
      currentDirectory: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform
    },
    railway: {
      environment: process.env.RAILWAY_ENVIRONMENT || 'false',
      publicDomain: process.env.RAILWAY_PUBLIC_DOMAIN || 'not set',
      projectId: process.env.RAILWAY_PROJECT_ID || 'not set'
    },
    server: {
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 for route:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/',
      '/app', 
      '/health',
      '/api/info',
      '/api/database/stats',
      '/api/database/search'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SmartChoice AI server is running on port ${PORT}`);
  console.log(`🌐 Main app: http://localhost:${PORT}/`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/api/info`);
  console.log(`🔧 Debug: http://localhost:${PORT}/debug/system`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;