# Decision Helper Web App 🧠

Advanced AI-powered decision-making assistant that helps users make better choices using machine learning algorithms and behavioral analysis.

## 🚀 Features

- **Smart Decision Types**: Simple (Emotion AI), Complex (MCDA), Random choice
- **AI Algorithms**: Emotion analysis, Contextual bandit, Behavioral patterns
- **Analytics**: Personal insights, decision tracking, success patterns
- **Authentication**: JWT, Google OAuth, Facebook login
- **Real-time**: WebSocket updates, instant recommendations
- **Mobile-First**: Responsive design, PWA capabilities

## 🏗️ Architecture

```
Frontend (React + TS) ↔ Backend (Node.js) ↔ ML Service (Python)
                              ↓
                         PostgreSQL + Redis
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **Auth**: JWT + Passport.js
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: React 18 + TypeScript
- **State**: Zustand/Redux Toolkit
- **UI**: Material-UI
- **Charts**: Chart.js
- **Build**: Vite

### ML/AI
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **ML**: scikit-learn, PyTorch
- **NLP**: Hugging Face Transformers
- **Data**: pandas, numpy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### 1. Clone Repository
```bash
git clone <repository-url>
cd decision-helper
```

### 2. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Start Services

#### Option A: Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Manual Setup
```bash
# Terminal 1: Start PostgreSQL and Redis
# (Install and start manually or use Docker)

# Terminal 2: Start Backend
npm run dev

# Terminal 3: Start ML Service
cd ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Terminal 4: Start Frontend (if separate)
cd frontend
npm install
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **API Docs**: http://localhost:3001/api-docs
- **DB Admin**: http://localhost:5050 (PgAdmin)

## 📋 Environment Variables

### Required
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/decision_helper_db"
JWT_SECRET="your-super-secret-jwt-key"
```

### Optional
```bash
# External APIs
HUGGINGFACE_API_KEY="your-huggingface-key"
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"

# Monitoring
SENTRY_DSN="your-sentry-dsn"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
```

## 🔧 Development

### Database Commands
```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate client after schema changes
npx prisma generate
```

### Testing
```bash
# Run backend tests
npm test

# Run ML service tests
cd ml-service
python -m pytest

# Run with coverage
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🗂️ Project Structure

```
├── src/                    # Backend source code
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── prisma/               # Database schema & migrations
├── ml-service/           # Python ML microservice
├── frontend/             # React frontend (if separate)
├── logs/                 # Application logs
├── docker-compose.yml    # Docker configuration
└── docs/                 # Documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Decisions
- `POST /api/decisions/simple` - Create simple decision
- `POST /api/decisions/complex` - Create complex decision
- `POST /api/decisions/random` - Create random decision
- `GET /api/decisions/history` - Get decision history

### ML/AI
- `POST /api/ml/emotion-decision` - Emotion-aware analysis
- `POST /api/ml/contextual-recommendation` - Contextual bandit
- `POST /api/ml/behavioral-analysis` - Behavioral patterns

### Analytics
- `GET /api/analytics/dashboard` - User dashboard
- `GET /api/analytics/insights` - Personal insights
- `GET /api/analytics/trends` - Trend analysis

## 🤖 ML Algorithms

### 1. Emotion-Aware Decision Tree
- Analyzes emotional context from text
- Uses Hugging Face emotion detection
- Adjusts recommendations based on mood

### 2. Contextual Neural Bandit
- Multi-armed bandit with context
- Learns from user preferences
- Balances exploration vs exploitation

### 3. Behavioral Pattern Analysis
- Tracks user decision patterns
- Identifies success factors
- Provides personalized insights

## 🔒 Security

- **Authentication**: JWT tokens with refresh
- **Authorization**: Role-based access control
- **Input Validation**: Joi schemas on all inputs
- **Rate Limiting**: 100 requests/minute per user
- **HTTPS**: SSL/TLS encryption everywhere
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Input sanitization

## 📊 Monitoring

- **Health Checks**: `/health` endpoint
- **Logging**: Structured logs with Winston
- **Metrics**: Custom metrics for decisions
- **Error Tracking**: Sentry integration
- **Performance**: Response time monitoring

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Load balancing configured

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment
- **Frontend**: Vercel, Netlify
- **Backend**: DigitalOcean Apps, AWS ECS
- **Database**: AWS RDS, DigitalOcean Managed
- **Cache**: AWS ElastiCache, DigitalOcean Redis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push to fork
git push origin feature/amazing-feature
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs/](docs/)
- **API Reference**: http://localhost:3001/api-docs
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 👥 Team

- **Backend Development**: Node.js, API design
- **Frontend Development**: React, UI/UX
- **ML Engineering**: Python, algorithms
- **DevOps**: Docker, deployment
- **QA**: Testing, quality assurance

---

Made with ❤️ by the Decision Helper Team
