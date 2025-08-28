const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.railway.app'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('.'));

// Cache control for development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Expires', '0');
        res.set('Pragma', 'no-cache');
        next();
    });
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Main app route
app.get('/app', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// API Routes

// Mock database for now (will be replaced with real PostgreSQL)
let mockDatabase = {
    decisions: [
        {
            id: 1,
            userId: 'demo_user',
            title: 'Выбор ноутбука для работы',
            question: 'Какой ноутбук выбрать для data science?',
            decisionType: 'simple',
            recommendation: 'MacBook Pro M2 или Dell XPS 15',
            confidence: 0.85,
            reasoning: 'Оба варианта отлично подходят для data science задач',
            alternatives: ['MacBook Pro M2', 'Dell XPS 15', 'Lenovo ThinkPad X1'],
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            userId: 'demo_user',
            title: 'Смена работы',
            question: 'Стоит ли сейчас менять работу?',
            decisionType: 'complex',
            recommendation: 'Подождать 3-6 месяцев',
            confidence: 0.72,
            reasoning: 'Рынок нестабилен, лучше накопить опыт и сбережения',
            alternatives: ['Сменить сейчас', 'Подождать 3-6 месяцев', 'Остаться на год'],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    users: [
        {
            id: 'demo_user',
            name: 'Демо пользователь',
            email: 'demo@smartchoice.ai',
            age: 28,
            personalityType: 'ambivert',
            anxietyLevel: 5,
            preferences: {
                data: true,
                intuition: false,
                speed: true,
                consultation: true
            },
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    analytics: {
        totalDecisions: 2,
        successRate: 78,
        avgConfidence: 78.5,
        decisionTypes: {
            simple: 1,
            complex: 1,
            random: 0
        },
        recentActivity: [
            {
                type: 'decision_created',
                description: 'Создано решение "Смена работы"',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'decision_created',
                description: 'Создано решение "Выбор ноутбука"',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ]
    }
};

// Decisions API
app.get('/api/decisions', (req, res) => {
    const { userId, type, limit = 50, offset = 0 } = req.query;
    
    let filteredDecisions = mockDatabase.decisions;
    
    if (userId) {
        filteredDecisions = filteredDecisions.filter(d => d.userId === userId);
    }
    
    if (type) {
        filteredDecisions = filteredDecisions.filter(d => d.decisionType === type);
    }
    
    const paginatedDecisions = filteredDecisions.slice(offset, offset + parseInt(limit));
    
    res.json({
        decisions: paginatedDecisions,
        total: filteredDecisions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
});

app.get('/api/decisions/recent', (req, res) => {
    const { limit = 5 } = req.query;
    const recentDecisions = mockDatabase.decisions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, parseInt(limit));
    
    res.json(recentDecisions);
});

app.get('/api/decisions/:id', (req, res) => {
    const decision = mockDatabase.decisions.find(d => d.id === parseInt(req.params.id));
    
    if (!decision) {
        return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
});

app.post('/api/decisions/simple', (req, res) => {
    const { question, userId, decisionType } = req.body;
    
    if (!question || !userId) {
        return res.status(400).json({ error: 'Question and userId are required' });
    }
    
    // Mock AI analysis
    const recommendations = [
        'Рекомендую тщательно взвесить все варианты',
        'Лучше всего выбрать первый вариант',
        'Стоит подождать и собрать больше информации',
        'Однозначно второй вариант'
    ];
    
    const reasoning = [
        'На основе анализа вашей ситуации, это наиболее оптимальное решение',
        'Учитывая все факторы, данный вариант имеет наибольшие преимущества',
        'Текущие обстоятельства указывают на необходимость данного выбора'
    ];
    
    const alternatives = [
        'Вариант A: Действовать немедленно',
        'Вариант B: Подождать и проанализировать',
        'Вариант C: Искать компромисс'
    ];
    
    const newDecision = {
        id: mockDatabase.decisions.length + 1,
        userId,
        title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        question,
        decisionType: decisionType || 'simple',
        recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        reasoning: reasoning[Math.floor(Math.random() * reasoning.length)],
        alternatives,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    mockDatabase.decisions.unshift(newDecision);
    mockDatabase.analytics.totalDecisions++;
    
    // Update analytics
    const totalConfidence = mockDatabase.decisions.reduce((sum, d) => sum + d.confidence, 0);
    mockDatabase.analytics.avgConfidence = Math.round((totalConfidence / mockDatabase.decisions.length) * 100);
    
    const successCount = mockDatabase.decisions.filter(d => d.confidence > 0.7).length;
    mockDatabase.analytics.successRate = Math.round((successCount / mockDatabase.decisions.length) * 100);
    
    res.status(201).json(newDecision);
});

app.put('/api/decisions/:id', (req, res) => {
    const decisionIndex = mockDatabase.decisions.findIndex(d => d.id === parseInt(req.params.id));
    
    if (decisionIndex === -1) {
        return res.status(404).json({ error: 'Decision not found' });
    }
    
    const updatedDecision = {
        ...mockDatabase.decisions[decisionIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    mockDatabase.decisions[decisionIndex] = updatedDecision;
    
    res.json(updatedDecision);
});

app.delete('/api/decisions/:id', (req, res) => {
    const decisionIndex = mockDatabase.decisions.findIndex(d => d.id === parseInt(req.params.id));
    
    if (decisionIndex === -1) {
        return res.status(404).json({ error: 'Decision not found' });
    }
    
    mockDatabase.decisions.splice(decisionIndex, 1);
    mockDatabase.analytics.totalDecisions--;
    
    res.status(204).send();
});

// Users API
app.get('/api/users/:id', (req, res) => {
    const user = mockDatabase.users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
});

app.put('/api/users/:id', (req, res) => {
    const userIndex = mockDatabase.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = {
        ...mockDatabase.users[userIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    mockDatabase.users[userIndex] = updatedUser;
    
    res.json(updatedUser);
});

app.get('/api/users/:id/stats', (req, res) => {
    const userDecisions = mockDatabase.decisions.filter(d => d.userId === req.params.id);
    
    const stats = {
        totalDecisions: userDecisions.length,
        avgConfidence: userDecisions.length > 0 
            ? Math.round(userDecisions.reduce((sum, d) => sum + d.confidence, 0) / userDecisions.length * 100)
            : 0,
        decisionTypes: userDecisions.reduce((acc, d) => {
            acc[d.decisionType] = (acc[d.decisionType] || 0) + 1;
            return acc;
        }, {}),
        recentDecisions: userDecisions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
    };
    
    res.json(stats);
});

// Analytics API
app.get('/api/analytics/overview', (req, res) => {
    res.json(mockDatabase.analytics);
});

app.get('/api/analytics/trends', (req, res) => {
    const { days = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const recentDecisions = mockDatabase.decisions.filter(d => new Date(d.createdAt) > cutoffDate);
    
    const trends = {
        period: `${days} дней`,
        totalDecisions: recentDecisions.length,
        avgConfidence: recentDecisions.length > 0 
            ? Math.round(recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / recentDecisions.length * 100)
            : 0,
        decisionTypes: recentDecisions.reduce((acc, d) => {
            acc[d.decisionType] = (acc[d.decisionType] || 0) + 1;
            return acc;
        }, {}),
        dailyActivity: Array.from({ length: parseInt(days) }, (_, i) => {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dayDecisions = recentDecisions.filter(d => 
                new Date(d.createdAt).toDateString() === date.toDateString()
            );
            return {
                date: date.toISOString().split('T')[0],
                count: dayDecisions.length,
                avgConfidence: dayDecisions.length > 0 
                    ? Math.round(dayDecisions.reduce((sum, d) => sum + d.confidence, 0) / dayDecisions.length * 100)
                    : 0
            };
        }).reverse()
    };
    
    res.json(trends);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Main app: http://localhost:${PORT}/app`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
});

module.exports = app;

