# 🚀 SmartChoice AI - Railway Ready

## 🎯 Quick Deploy to Railway

This repository is **fully configured** and **ready for Railway deployment**.

### 🌟 What's Included

- ✅ **CSV Database Integration** - 7 data files with decision intelligence
- ✅ **Perplexity AI API** - Real-time AI insights and recommendations  
- ✅ **Enhanced Algorithms** - AHP, TOPSIS, Emotion AI, Contextual Bandit
- ✅ **REST API** - Complete backend with authentication
- ✅ **Railway Configuration** - Optimized for Railway platform

## 🚀 One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Manual Deploy Steps:

1. **Fork this repository**
2. **Go to [Railway](https://railway.com)**
3. **Create new project from GitHub repo**
4. **Set environment variables** (see below)
5. **Deploy!**

## 🔧 Required Environment Variables

```env
NODE_ENV=production
PORT=3000
PERPLEXITY_API_KEY=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
```

## 📊 API Endpoints

Once deployed, your API will be available at `https://your-app.railway.app`:

### Health Check
```
GET /health
```

### Database API
```
GET /api/database/stats
GET /api/database/categories
GET /api/database/criteria
```

### Perplexity AI
```
GET /api/perplexity/test
POST /api/perplexity/insights
POST /api/perplexity/market-analysis
```

### Decision Algorithms
```
POST /api/decisions/analyze
POST /api/decisions/simple
POST /api/decisions/complex
```

## 🗄️ Database Structure

The app includes CSV-based database with:
- **7 CSV files** with decision data
- **Automatic caching** for performance
- **Real-time analytics** and insights

## 🤖 AI Integration

### Perplexity AI Features:
- Decision analysis and insights
- Market research and trends
- Expert advice and recommendations
- Custom AI queries

### Enhanced Algorithms:
- **Emotion AI** with anxiety reduction
- **AHP** with database-driven criteria
- **TOPSIS** with historical outcomes
- **Contextual Bandit** with personalization

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
smartchoice-ai/
├── index.js              # Railway entry point
├── package.json          # Dependencies & scripts
├── railway.json          # Railway configuration
├── Dockerfile            # Docker alternative
├── src/
│   ├── server.js         # Main server file
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── middleware/       # Express middleware
├── data/                 # CSV database files
└── docs/                 # Documentation
```

## 🔍 Testing

After deployment, test your API:

```bash
# Health check
curl https://your-app.railway.app/health

# Database status
curl https://your-app.railway.app/api/database/stats

# Perplexity AI test
curl https://your-app.railway.app/api/perplexity/test
```

## 📖 Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [Database Integration](./DATABASE_INTEGRATION_README.md)
- [API Documentation](./api_specification.csv)

## 🏷️ Features

- **🗄️ CSV Database** - 7 comprehensive datasets
- **🤖 Perplexity AI** - Real-time AI insights
- **📊 Analytics** - Decision tracking and analysis  
- **🔐 Authentication** - JWT & OAuth support
- **⚡ Performance** - Caching and optimization
- **🐳 Docker** - Container support
- **🛤️ Railway** - Optimized deployment

## 📞 Support

- Check [Railway Documentation](https://docs.railway.app)
- View deployment logs in Railway dashboard
- See troubleshooting in [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

---

**🎉 Ready to deploy? Click the Railway button above!**
