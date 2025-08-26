import express from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { adminMiddleware } from '../middleware/auth.js';
import { logger } from '../services/logger.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user's detailed profile
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      personalityType: true,
      anxietyLevel: true,
      provider: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        decisions: true,
        behaviors: true
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  res.json({ user });
}));

/**
 * DELETE /api/users/account
 * Delete user account and all associated data
 */
router.delete('/account', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { confirmEmail } = req.body;

  // Verify email confirmation
  if (confirmEmail !== req.user.email) {
    return res.status(400).json({
      error: 'Confirmation Required',
      message: 'Email confirmation does not match'
    });
  }

  // Delete all user data in transaction
  await prisma.$transaction(async (tx) => {
    // Delete in correct order to respect foreign key constraints
    await tx.userBehavior.deleteMany({ where: { userId } });
    await tx.algorithmPerformance.deleteMany({ where: { userId } });
    await tx.decisionOption.deleteMany({
      where: {
        decision: { userId }
      }
    });
    await tx.decision.deleteMany({ where: { userId } });
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  logger.info(`User account deleted: ${req.user.email}`);

  res.json({
    message: 'Account successfully deleted'
  });
}));

/**
 * GET /api/users/stats
 * Get user statistics summary
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    totalDecisions,
    decisionsByType,
    avgOutcomeRating,
    recentActivity,
    totalBehaviorPoints,
    algorithmUsage
  ] = await Promise.all([
    // Total decisions
    prisma.decision.count({ where: { userId } }),
    
    // Decisions by type
    prisma.decision.groupBy({
      by: ['decisionType'],
      where: { userId },
      _count: { id: true }
    }),
    
    // Average outcome rating
    prisma.decision.aggregate({
      where: {
        userId,
        outcomeRating: { not: null }
      },
      _avg: { outcomeRating: true },
      _count: { outcomeRating: true }
    }),
    
    // Recent activity (last 30 days)
    prisma.decision.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Total behavior data points
    prisma.userBehavior.count({ where: { userId } }),
    
    // Algorithm usage stats
    prisma.algorithmPerformance.groupBy({
      by: ['algorithmType'],
      where: { userId },
      _count: { id: true },
      _avg: { processingTime: true }
    })
  ]);

  // Process decision types
  const decisionTypes = decisionsByType.reduce((acc, item) => {
    acc[item.decisionType] = item._count.id;
    return acc;
  }, { simple: 0, complex: 0, random: 0 });

  // Process algorithm usage
  const algorithms = algorithmUsage.reduce((acc, item) => {
    acc[item.algorithmType] = {
      count: item._count.id,
      avgProcessingTime: Math.round(item._avg.processingTime || 0)
    };
    return acc;
  }, {});

  const stats = {
    decisions: {
      total: totalDecisions,
      byType: decisionTypes,
      recentActivity
    },
    outcomes: {
      averageRating: avgOutcomeRating._avg.outcomeRating || 0,
      ratedDecisions: avgOutcomeRating._count.outcomeRating || 0
    },
    engagement: {
      behaviorDataPoints: totalBehaviorPoints
    },
    algorithms,
    memberSince: req.user.createdAt
  };

  res.json(stats);
}));

/**
 * POST /api/users/feedback
 * Submit user feedback
 */
router.post('/feedback', asyncHandler(async (req, res) => {
  const { type, message, rating, metadata } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Type and message are required'
    });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Rating must be between 1 and 5'
    });
  }

  // Store feedback (you might want a separate feedback table)
  const feedbackData = {
    userId: req.user.id,
    type,
    message,
    rating,
    metadata,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date()
  };

  // For now, just log it
  logger.info('User feedback received:', feedbackData);

  // In production, you'd store this in a feedback table
  // await prisma.feedback.create({ data: feedbackData });

  res.status(201).json({
    message: 'Feedback submitted successfully',
    id: `feedback_${Date.now()}`
  });
}));

/**
 * GET /api/users/activity
 * Get user activity timeline
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  // Get recent decisions and behavior
  const [decisions, behaviors] = await Promise.all([
    prisma.decision.findMany({
      where: { userId },
      select: {
        id: true,
        decisionType: true,
        title: true,
        createdAt: true,
        outcomeRating: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    
    prisma.userBehavior.findMany({
      where: {
        userId,
        actionType: {
          in: ['decision_created', 'outcome_rated', 'profile_updated']
        }
      },
      select: {
        actionType: true,
        createdAt: true,
        metadata: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    })
  ]);

  // Combine and sort activities
  const activities = [
    ...decisions.map(d => ({
      type: 'decision',
      action: `Created ${d.decisionType} decision`,
      title: d.title,
      id: d.id,
      timestamp: d.createdAt,
      metadata: { decisionType: d.decisionType, rating: d.outcomeRating }
    })),
    ...behaviors.map(b => ({
      type: 'behavior',
      action: b.actionType.replace('_', ' '),
      timestamp: b.createdAt,
      metadata: b.metadata
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
   .slice(0, parseInt(limit));

  res.json({
    activities,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: activities.length === parseInt(limit)
    }
  });
}));

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
router.put('/preferences', asyncHandler(async (req, res) => {
  const { 
    notifications,
    dataSharing,
    algorithmPreferences,
    uiPreferences 
  } = req.body;

  // For now, store preferences in user metadata
  // In production, you might want a separate preferences table
  const preferences = {
    notifications: notifications || {},
    dataSharing: dataSharing || {},
    algorithmPreferences: algorithmPreferences || {},
    uiPreferences: uiPreferences || {},
    updatedAt: new Date()
  };

  // Update user with preferences stored in a JSON field
  // Note: You'd need to add a preferences field to the User model
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      // For now, we'll store in contextData or create a separate field
      updatedAt: new Date()
    }
  });

  logger.info(`Preferences updated for user ${req.user.email}`);

  res.json({
    message: 'Preferences updated successfully',
    preferences
  });
}));

// Admin-only routes
/**
 * GET /api/users/admin/list
 * Get list of all users (admin only)
 */
router.get('/admin/list', adminMiddleware, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, search } = req.query;

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          decisions: true
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    }),
    
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    }
  });
}));

/**
 * GET /api/users/admin/stats
 * Get overall user statistics (admin only)
 */
router.get('/admin/stats', adminMiddleware, asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    newUsers,
    usersByProvider,
    avgDecisionsPerUser
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Active users (logged in last 30 days)
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // New users (registered in last 30 days)
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Users by provider
    prisma.user.groupBy({
      by: ['provider'],
      _count: { id: true }
    }),
    
    // Average decisions per user
    prisma.decision.aggregate({
      _count: { id: true }
    }).then(result => result._count.id)
  ]);

  const providerStats = usersByProvider.reduce((acc, item) => {
    acc[item.provider || 'unknown'] = item._count.id;
    return acc;
  }, {});

  res.json({
    overview: {
      totalUsers,
      activeUsers,
      newUsers,
      avgDecisionsPerUser: totalUsers > 0 ? Math.round(avgDecisionsPerUser / totalUsers) : 0
    },
    providers: providerStats
  });
}));

export default router;
