const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get overall system statistics
router.get('/overview', async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total users
      prisma.user.count(),
      // Total decisions
      prisma.decision.count(),
      // Decisions by type
      prisma.decision.groupBy({
        by: ['decisionType'],
        _count: true
      }),
      // Recent activity (last 7 days)
      prisma.decision.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Average confidence scores
      prisma.decision.aggregate({
        _avg: {
          confidenceScore: true
        }
      })
    ]);
    
    const [totalUsers, totalDecisions, decisionsByType, recentDecisions, avgConfidence] = stats;
    
    const typeBreakdown = decisionsByType.reduce((acc, item) => {
      acc[item.decisionType] = item._count;
      return acc;
    }, {});
    
    res.json({
      users: {
        total: totalUsers
      },
      decisions: {
        total: totalDecisions,
        byType: typeBreakdown,
        recent: recentDecisions
      },
      performance: {
        averageConfidence: avgConfidence._avg.confidenceScore || 0,
        successRate: totalDecisions > 0 ? Math.round((recentDecisions / totalDecisions) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Failed to fetch overview statistics' });
  }
});

// Get decision trends over time
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const decisions = await prisma.decision.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true,
        decisionType: true,
        confidenceScore: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Group by date
    const dailyStats = {};
    decisions.forEach(decision => {
      const date = decision.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          byType: {},
          avgConfidence: 0,
          confidenceSum: 0
        };
      }
      
      dailyStats[date].total++;
      dailyStats[date].byType[decision.decisionType] = (dailyStats[date].byType[decision.decisionType] || 0) + 1;
      
      if (decision.confidenceScore) {
        dailyStats[date].confidenceSum += decision.confidenceScore;
        dailyStats[date].avgConfidence = dailyStats[date].confidenceSum / dailyStats[date].total;
      }
    });
    
    // Convert to array format for charts
    const trends = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      total: stats.total,
      byType: stats.byType,
      avgConfidence: Math.round(stats.avgConfidence * 100) / 100
    }));
    
    res.json({
      period: `${days} days`,
      trends,
      summary: {
        totalDecisions: decisions.length,
        averageDaily: Math.round(decisions.length / parseInt(days) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch decision trends' });
  }
});

// Get user engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (userId) {
      // User-specific engagement
      const userStats = await prisma.$transaction([
        prisma.decision.count({
          where: { userId }
        }),
        prisma.userBehavior.count({
          where: { userId }
        }),
        prisma.decision.findMany({
          where: { userId },
          select: {
            createdAt: true,
            decisionType: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);
      
      const [totalDecisions, totalBehaviors, recentDecisions] = userStats;
      
      // Calculate engagement score
      const engagementScore = Math.min(100, Math.round(
        (totalDecisions * 10 + totalBehaviors * 2) / 10
      ));
      
      res.json({
        userId,
        engagement: {
          score: engagementScore,
          level: engagementScore >= 80 ? 'high' : engagementScore >= 50 ? 'medium' : 'low'
        },
        activity: {
          totalDecisions,
          totalBehaviors,
          recentDecisions: recentDecisions.length
        },
        recentDecisions
      });
    } else {
      // Overall engagement metrics
      const overallStats = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.decision.aggregate({
          _avg: {
            confidenceScore: true
          }
        })
      ]);
      
      const [totalUsers, activeUsers, avgConfidence] = overallStats;
      
      res.json({
        users: {
          total: totalUsers,
          active: activeUsers,
          activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
        },
        engagement: {
          averageConfidence: avgConfidence._avg.confidenceScore || 0,
          averageDecisionsPerUser: totalUsers > 0 ? Math.round(100 / totalUsers * 100) / 100 : 0
        }
      });
    }
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

// Get algorithm performance metrics
router.get('/algorithms', async (req, res) => {
  try {
    const algorithmStats = await prisma.algorithmPerformance.groupBy({
      by: ['algorithmType'],
      _count: true,
      _avg: {
        processingTime: true,
        userSatisfaction: true
      }
    });
    
    const performance = algorithmStats.map(stat => ({
      algorithm: stat.algorithmType,
      usageCount: stat._count,
      averageProcessingTime: Math.round(stat._avg.processingTime || 0),
      averageSatisfaction: Math.round(stat._avg.userSatisfaction || 0)
    }));
    
    res.json({
      algorithms: performance,
      summary: {
        totalAlgorithms: performance.length,
        mostUsed: performance.reduce((max, curr) => 
          curr.usageCount > max.usageCount ? curr : max
        )?.algorithm || 'none',
        fastest: performance.reduce((min, curr) => 
          curr.averageProcessingTime < min.averageProcessingTime ? curr : min
        )?.algorithm || 'none'
      }
    });
  } catch (error) {
    console.error('Error fetching algorithm metrics:', error);
    res.status(500).json({ error: 'Failed to fetch algorithm metrics' });
  }
});

// Get real-time activity feed
router.get('/activity-feed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const activities = await prisma.decision.findMany({
      take: parseInt(limit),
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        options: {
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const feed = activities.map(decision => ({
      id: decision.id,
      type: 'decision_created',
      user: decision.user.name || decision.user.email,
      action: `Created ${decision.decisionType} decision`,
      title: decision.title,
      timestamp: decision.createdAt,
      metadata: {
        decisionType: decision.decisionType,
        optionsCount: decision.options.length
      }
    }));
    
    res.json({
      activities: feed,
      total: feed.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

module.exports = router;
