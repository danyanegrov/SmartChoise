const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        personalityType: true,
        anxietyLevel: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            decisions: true,
            behaviors: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create or update user
router.post('/profile', async (req, res) => {
  try {
    const { email, name, age, personalityType, anxietyLevel } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Try to find existing user or create new one
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          age: age ? parseInt(age) : null,
          personalityType,
          anxietyLevel: anxietyLevel ? parseInt(anxietyLevel) : null,
          lastLoginAt: new Date()
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          age: age ? parseInt(age) : null,
          personalityType,
          anxietyLevel: anxietyLevel ? parseInt(anxietyLevel) : null,
          provider: 'email',
          isEmailVerified: false
        }
      });
    }
    
    res.json({
      message: user.id ? 'User updated successfully' : 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        personalityType: user.personalityType,
        anxietyLevel: user.anxietyLevel
      }
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await prisma.$transaction([
      // Total decisions
      prisma.decision.count({
        where: { userId }
      }),
      // Decisions by type
      prisma.decision.groupBy({
        by: ['decisionType'],
        where: { userId },
        _count: true
      }),
      // Recent activity
      prisma.decision.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      // Average confidence score
      prisma.decision.aggregate({
        where: { userId },
        _avg: {
          confidenceScore: true
        }
      })
    ]);
    
    const [totalDecisions, decisionsByType, recentDecisions, avgConfidence] = stats;
    
    const typeBreakdown = decisionsByType.reduce((acc, item) => {
      acc[item.decisionType] = item._count;
      return acc;
    }, {});
    
    res.json({
      totalDecisions,
      decisionsByType: typeBreakdown,
      recentDecisions,
      averageConfidence: avgConfidence._avg.confidenceScore || 0,
      successRate: totalDecisions > 0 ? Math.round((recentDecisions / totalDecisions) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Update user preferences
router.patch('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { personalityType, anxietyLevel } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        personalityType,
        anxietyLevel: anxietyLevel ? parseInt(anxietyLevel) : null
      }
    });
    
    res.json({
      message: 'Preferences updated successfully',
      user: {
        id: user.id,
        personalityType: user.personalityType,
        anxietyLevel: user.anxietyLevel
      }
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Track user behavior
router.post('/behavior', async (req, res) => {
  try {
    const { userId, sessionId, actionType, pageUrl, elementClicked, timeSpent, hesitationTime, metadata } = req.body;
    
    if (!userId || !actionType) {
      return res.status(400).json({ error: 'UserId and actionType are required' });
    }

    const behavior = await prisma.userBehavior.create({
      data: {
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        actionType,
        pageUrl,
        elementClicked,
        timeSpent: timeSpent ? parseInt(timeSpent) : null,
        hesitationTime: hesitationTime ? parseInt(hesitationTime) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
    
    res.json({
      message: 'Behavior tracked successfully',
      behaviorId: behavior.id
    });
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    res.status(500).json({ error: 'Failed to track user behavior' });
  }
});

module.exports = router;
