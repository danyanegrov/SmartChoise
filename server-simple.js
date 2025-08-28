const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching for development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '0');
  res.set('Pragma', 'no-cache');
  next();
});

// Static files
app.use(express.static('public'));
app.use(express.static('.')); // Serve project root for redesigned assets

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Main app route
app.get('/app', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Mock API endpoints for testing
app.get('/api/decisions/recent', (req, res) => {
  const mockDecisions = [
    {
      id: '1',
      title: 'Выбор ноутбука для работы',
      decisionType: 'complex',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      chosenOption: 'MacBook Pro 16"',
      options: [
        { optionText: 'MacBook Pro 16"', aiScore: 0.85 },
        { optionText: 'Dell XPS 15', aiScore: 0.72 },
        { optionText: 'Lenovo ThinkPad', aiScore: 0.68 }
      ]
    },
    {
      id: '2',
      title: 'Смена работы',
      decisionType: 'simple',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      chosenOption: 'Да, стоит сменить',
      options: [
        { optionText: 'Да, стоит сменить', aiScore: 0.78 },
        { optionText: 'Нет, лучше остаться', aiScore: 0.22 }
      ]
    },
    {
      id: '3',
      title: 'Покупка квартиры',
      decisionType: 'complex',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      chosenOption: 'Подождать лучших условий',
      options: [
        { optionText: 'Купить сейчас', aiScore: 0.45 },
        { optionText: 'Подождать лучших условий', aiScore: 0.82 },
        { optionText: 'Арендовать', aiScore: 0.65 }
      ]
    }
  ];
  
  res.json(mockDecisions);
});

app.post('/api/decisions/simple', (req, res) => {
  const { question } = req.body;
  
  // Mock AI response
  const response = {
    decision: {
      id: 'temp_' + Date.now(),
      title: question,
      decisionType: 'simple',
      createdAt: new Date().toISOString()
    },
    recommendation: 'На основе анализа вашего вопроса, я рекомендую тщательно взвесить все варианты.',
    confidence: 0.75,
    reasoning: 'Это решение основано на анализе рисков и потенциальных выгод. Учитывая контекст, важно не торопиться.',
    alternatives: [
      'Да, стоит это сделать',
      'Нет, лучше подождать',
      'Нужно больше информации'
    ]
  };
  
  res.json(response);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Main app: http://localhost:${PORT}/app`);
});
