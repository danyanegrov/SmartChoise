const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get all decisions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const decisions = await prisma.decision.findMany({
      where: { userId },
      include: {
        options: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

// Get recent decisions (last 10)
router.get('/recent', async (req, res) => {
  try {
    const decisions = await prisma.decision.findMany({
      take: 10,
      include: {
        options: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching recent decisions:', error);
    res.status(500).json({ error: 'Failed to fetch recent decisions' });
  }
});

// Create simple decision
router.post('/simple', async (req, res) => {
  try {
    const { question, userId, decisionType = 'simple' } = req.body;
    
    if (!question || !userId) {
      return res.status(400).json({ error: 'Question and userId are required' });
    }

    // Create decision with mock AI response for now
    const decision = await prisma.decision.create({
      data: {
        userId,
        decisionType,
        title: question,
        description: question,
        contextData: JSON.stringify({ question, timestamp: new Date().toISOString() }),
        options: {
          create: [
            {
              optionText: 'Да, стоит это сделать',
              aiScore: 0.7,
              criteriaScores: JSON.stringify({ confidence: 0.7, risk: 0.3 })
            },
            {
              optionText: 'Нет, лучше подождать',
              aiScore: 0.3,
              criteriaScores: JSON.stringify({ confidence: 0.3, risk: 0.7 })
            }
          ]
        }
      },
      include: {
        options: true
      }
    });

    // Mock AI response
    const aiResponse = {
      decision: decision,
      recommendation: 'На основе анализа вашего вопроса, я рекомендую первый вариант.',
      confidence: 0.75,
      reasoning: 'Это решение основано на анализе рисков и потенциальных выгод.',
      alternatives: decision.options.map(opt => opt.optionText)
    };

    res.json(aiResponse);
  } catch (error) {
    console.error('Error creating decision:', error);
    res.status(500).json({ error: 'Failed to create decision' });
  }
});

// Create complex decision with multiple options
router.post('/complex', async (req, res) => {
  try {
    const { question, options, criteria, userId } = req.body;
    
    if (!question || !options || !userId) {
      return res.status(400).json({ error: 'Question, options, and userId are required' });
    }

    const decision = await prisma.decision.create({
      data: {
        userId,
        decisionType: 'complex',
        title: question,
        description: question,
        contextData: JSON.stringify({ 
          question, 
          criteria, 
          timestamp: new Date().toISOString() 
        }),
        options: {
          create: options.map((option, index) => ({
            optionText: option,
            aiScore: Math.random() * 0.5 + 0.5, // Mock score between 0.5-1.0
            criteriaScores: JSON.stringify({ 
              score: Math.random() * 0.5 + 0.5,
              rank: index + 1
            })
          }))
        }
      },
      include: {
        options: true
      }
    });

    // Mock AI analysis
    const aiResponse = {
      decision: decision,
      analysis: 'Комплексный анализ показал следующие результаты:',
      recommendations: decision.options
        .sort((a, b) => b.aiScore - a.aiScore)
        .map((opt, index) => ({
          option: opt.optionText,
          score: opt.aiScore,
          rank: index + 1,
          reasoning: `Вариант ${index + 1} показал лучший результат по критериям`
        }))
    };

    res.json(aiResponse);
  } catch (error) {
    console.error('Error creating complex decision:', error);
    res.status(500).json({ error: 'Failed to create complex decision' });
  }
});

// Get decision by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const decision = await prisma.decision.findUnique({
      where: { id },
      include: {
        options: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
  } catch (error) {
    console.error('Error fetching decision:', error);
    res.status(500).json({ error: 'Failed to fetch decision' });
  }
});

// Update decision outcome
router.patch('/:id/outcome', async (req, res) => {
  try {
    const { id } = req.params;
    const { chosenOption, outcomeRating, confidenceScore } = req.body;
    
    const decision = await prisma.decision.update({
      where: { id },
      data: {
        chosenOption,
        outcomeRating,
        confidenceScore
      }
    });
    
    res.json(decision);
  } catch (error) {
    console.error('Error updating decision outcome:', error);
    res.status(500).json({ error: 'Failed to update decision outcome' });
  }
});

// Delete decision
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.decision.delete({
      where: { id }
    });
    
    res.json({ message: 'Decision deleted successfully' });
  } catch (error) {
    console.error('Error deleting decision:', error);
    res.status(500).json({ error: 'Failed to delete decision' });
  }
});

module.exports = router;
