import express from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics for the user
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { timeRange = '30d' } = req.query;

  // Calculate date range
  const now = new Date();
  const timeRanges = {
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  };
  
  const fromDate = timeRanges[timeRange] || timeRanges['30d'];

  // Get basic statistics
  const [
    totalDecisions,
    decisionsInRange,
    decisionsByType,
    avgOutcomeRating,
    recentDecisions,
    behaviorData
  ] = await Promise.all([
    // Total decisions ever
    prisma.decision.count({
      where: { userId }
    }),
    
    // Decisions in time range
    prisma.decision.count({
      where: {
        userId,
        createdAt: { gte: fromDate }
      }
    }),
    
    // Decisions by type
    prisma.decision.groupBy({
      by: ['decisionType'],
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      _count: {
        id: true
      }
    }),
    
    // Average outcome rating
    prisma.decision.aggregate({
      where: {
        userId,
        outcomeRating: { not: null },
        createdAt: { gte: fromDate }
      },
      _avg: {
        outcomeRating: true
      },
      _count: {
        outcomeRating: true
      }
    }),
    
    // Recent decisions for trends
    prisma.decision.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      select: {
        decisionType: true,
        outcomeRating: true,
        confidenceScore: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    }),
    
    // Behavior data for insights
    prisma.userBehavior.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      select: {
        actionType: true,
        hesitationTime: true,
        timeSpent: true,
        createdAt: true
      },
      take: 500
    })
  ]);

  // Process decision types
  const decisionTypesMap = decisionsByType.reduce((acc, item) => {
    acc[item.decisionType] = item._count.id;
    return acc;
  }, {});

  // Calculate trends
  const trends = calculateTrends(recentDecisions);
  
  // Calculate decision speed insights
  const speedInsights = calculateSpeedInsights(behaviorData);
  
  // Calculate success patterns
  const successPatterns = calculateSuccessPatterns(recentDecisions);

  const dashboardData = {
    overview: {
      totalDecisions,
      decisionsInRange,
      avgOutcomeRating: avgOutcomeRating._avg.outcomeRating || 0,
      ratedDecisions: avgOutcomeRating._count.outcomeRating || 0
    },
    decisionTypes: {
      simple: decisionTypesMap.simple || 0,
      complex: decisionTypesMap.complex || 0,
      random: decisionTypesMap.random || 0
    },
    trends,
    speedInsights,
    successPatterns,
    timeRange
  };

  logger.info(`Dashboard analytics generated for user ${req.user.email}`);

  res.json(dashboardData);
}));

/**
 * GET /api/analytics/insights
 * Get personalized insights and recommendations
 */
router.get('/insights', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get comprehensive user data
  const [decisions, algorithmPerf, behaviorData] = await Promise.all([
    prisma.decision.findMany({
      where: { userId },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    
    prisma.algorithmPerformance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    
    prisma.userBehavior.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
  ]);

  // Generate insights
  const insights = await generatePersonalizedInsights(
    decisions, 
    algorithmPerf, 
    behaviorData, 
    req.user
  );

  logger.info(`Personal insights generated for user ${req.user.email}`);

  res.json({
    insights,
    dataQuality: {
      decisions: decisions.length,
      algorithmRuns: algorithmPerf.length,
      behaviorPoints: behaviorData.length,
      reliability: calculateReliabilityScore(decisions, behaviorData)
    },
    generatedAt: new Date().toISOString()
  });
}));

/**
 * GET /api/analytics/trends
 * Get detailed trend analysis
 */
router.get('/trends', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { metric = 'decisions', period = 'daily' } = req.query;

  // Calculate date ranges for trend analysis
  const now = new Date();
  const periods = {
    daily: { days: 30, groupBy: 'day' },
    weekly: { days: 84, groupBy: 'week' }, // 12 weeks
    monthly: { days: 365, groupBy: 'month' } // 12 months
  };

  const config = periods[period] || periods.daily;
  const fromDate = new Date(now.getTime() - config.days * 24 * 60 * 60 * 1000);

  let trendData;

  if (metric === 'decisions') {
    trendData = await getDecisionTrends(userId, fromDate, config.groupBy);
  } else if (metric === 'satisfaction') {
    trendData = await getSatisfactionTrends(userId, fromDate, config.groupBy);
  } else if (metric === 'speed') {
    trendData = await getSpeedTrends(userId, fromDate, config.groupBy);
  } else {
    return res.status(400).json({
      error: 'Invalid metric',
      message: 'Metric must be one of: decisions, satisfaction, speed'
    });
  }

  res.json({
    metric,
    period,
    data: trendData,
    summary: calculateTrendSummary(trendData)
  });
}));

/**
 * GET /api/analytics/export
 * Export analytics data to CSV
 */
router.get('/export', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { format = 'csv', type = 'decisions' } = req.query;

  if (format !== 'csv') {
    return res.status(400).json({
      error: 'Invalid format',
      message: 'Only CSV format is currently supported'
    });
  }

  let data, filename;

  if (type === 'decisions') {
    data = await exportDecisionsData(userId);
    filename = `decisions_export_${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'analytics') {
    data = await exportAnalyticsData(userId);
    filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    return res.status(400).json({
      error: 'Invalid type',
      message: 'Type must be one of: decisions, analytics'
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(data);

  logger.info(`Data export (${type}) for user ${req.user.email}`);
}));

// Helper functions

function calculateTrends(decisions) {
  if (decisions.length === 0) {
    return {
      decisionFrequency: 'no_data',
      outcomeImprovement: 'no_data',
      confidenceTrend: 'no_data'
    };
  }

  // Sort by date (oldest first for trend calculation)
  const sortedDecisions = [...decisions].reverse();
  
  // Calculate decision frequency trend
  const recentCount = decisions.filter(d => 
    new Date(d.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const previousCount = decisions.filter(d => {
    const date = new Date(d.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return date <= weekAgo && date > twoWeeksAgo;
  }).length;

  let decisionFrequency = 'stable';
  if (recentCount > previousCount * 1.2) decisionFrequency = 'increasing';
  else if (recentCount < previousCount * 0.8) decisionFrequency = 'decreasing';

  // Calculate outcome improvement
  const ratedDecisions = sortedDecisions.filter(d => d.outcomeRating);
  let outcomeImprovement = 'stable';
  
  if (ratedDecisions.length >= 4) {
    const firstHalf = ratedDecisions.slice(0, Math.floor(ratedDecisions.length / 2));
    const secondHalf = ratedDecisions.slice(Math.floor(ratedDecisions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.outcomeRating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.outcomeRating, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.3) outcomeImprovement = 'improving';
    else if (secondAvg < firstAvg - 0.3) outcomeImprovement = 'declining';
  }

  // Calculate confidence trend
  const confidenceDecisions = sortedDecisions.filter(d => d.confidenceScore);
  let confidenceTrend = 'stable';
  
  if (confidenceDecisions.length >= 4) {
    const firstHalf = confidenceDecisions.slice(0, Math.floor(confidenceDecisions.length / 2));
    const secondHalf = confidenceDecisions.slice(Math.floor(confidenceDecisions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.confidenceScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.confidenceScore, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) confidenceTrend = 'improving';
    else if (secondAvg < firstAvg - 5) confidenceTrend = 'declining';
  }

  return {
    decisionFrequency,
    outcomeImprovement,
    confidenceTrend
  };
}

function calculateSpeedInsights(behaviorData) {
  if (behaviorData.length === 0) {
    return {
      avgHesitationTime: 0,
      speedCategory: 'unknown',
      improvementSuggestion: 'Need more data to analyze decision speed'
    };
  }

  const hesitationTimes = behaviorData
    .filter(b => b.hesitationTime && b.hesitationTime > 0)
    .map(b => b.hesitationTime);

  if (hesitationTimes.length === 0) {
    return {
      avgHesitationTime: 0,
      speedCategory: 'unknown',
      improvementSuggestion: 'No hesitation data available'
    };
  }

  const avgHesitationTime = hesitationTimes.reduce((a, b) => a + b, 0) / hesitationTimes.length;
  
  let speedCategory, improvementSuggestion;
  
  if (avgHesitationTime < 30) {
    speedCategory = 'fast';
    improvementSuggestion = 'You make quick decisions. Consider adding brief reflection for important choices.';
  } else if (avgHesitationTime < 120) {
    speedCategory = 'moderate';
    improvementSuggestion = 'You have a balanced decision-making pace. Keep it up!';
  } else {
    speedCategory = 'deliberate';
    improvementSuggestion = 'You take time to think. Try setting time limits for routine decisions.';
  }

  return {
    avgHesitationTime: Math.round(avgHesitationTime),
    speedCategory,
    improvementSuggestion
  };
}

function calculateSuccessPatterns(decisions) {
  const patterns = {
    bestTimeOfDay: null,
    bestDecisionType: null,
    successRate: 0,
    patterns: []
  };

  const ratedDecisions = decisions.filter(d => d.outcomeRating);
  
  if (ratedDecisions.length === 0) {
    return patterns;
  }

  // Calculate overall success rate
  const successfulDecisions = ratedDecisions.filter(d => d.outcomeRating >= 4);
  patterns.successRate = (successfulDecisions.length / ratedDecisions.length) * 100;

  // Find best time of day
  const timeGroups = {};
  ratedDecisions.forEach(d => {
    const hour = new Date(d.createdAt).getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    if (!timeGroups[timeOfDay]) {
      timeGroups[timeOfDay] = { total: 0, successful: 0 };
    }
    
    timeGroups[timeOfDay].total++;
    if (d.outcomeRating >= 4) {
      timeGroups[timeOfDay].successful++;
    }
  });

  let bestTime = null;
  let bestRate = 0;
  
  Object.entries(timeGroups).forEach(([time, data]) => {
    const rate = data.successful / data.total;
    if (rate > bestRate && data.total >= 2) { // Need at least 2 decisions
      bestRate = rate;
      bestTime = time;
    }
  });
  
  patterns.bestTimeOfDay = bestTime;

  // Find best decision type
  const typeGroups = {};
  ratedDecisions.forEach(d => {
    if (!typeGroups[d.decisionType]) {
      typeGroups[d.decisionType] = { total: 0, successful: 0 };
    }
    
    typeGroups[d.decisionType].total++;
    if (d.outcomeRating >= 4) {
      typeGroups[d.decisionType].successful++;
    }
  });

  let bestType = null;
  let bestTypeRate = 0;
  
  Object.entries(typeGroups).forEach(([type, data]) => {
    const rate = data.successful / data.total;
    if (rate > bestTypeRate && data.total >= 2) {
      bestTypeRate = rate;
      bestType = type;
    }
  });
  
  patterns.bestDecisionType = bestType;

  return patterns;
}

async function generatePersonalizedInsights(decisions, algorithmPerf, behaviorData, user) {
  const insights = [];

  // Decision frequency insight
  if (decisions.length >= 10) {
    const recentDecisions = decisions.filter(d => 
      new Date(d.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    insights.push({
      category: 'productivity',
      type: 'observation',
      title: 'Decision Activity',
      message: `You've made ${recentDecisions.length} decisions in the last 30 days`,
      importance: 'medium'
    });
  }

  // Success rate insight
  const ratedDecisions = decisions.filter(d => d.outcomeRating);
  if (ratedDecisions.length >= 5) {
    const successRate = (ratedDecisions.filter(d => d.outcomeRating >= 4).length / ratedDecisions.length) * 100;
    
    if (successRate >= 80) {
      insights.push({
        category: 'performance',
        type: 'strength',
        title: 'High Success Rate',
        message: `Your decisions have an ${Math.round(successRate)}% success rate - excellent!`,
        importance: 'high'
      });
    } else if (successRate < 50) {
      insights.push({
        category: 'performance',
        type: 'improvement',
        title: 'Decision Outcomes',
        message: `Consider spending more time on decision analysis to improve outcomes`,
        importance: 'high'
      });
    }
  }

  // Anxiety-based insights
  if (user.anxietyLevel >= 7) {
    insights.push({
      category: 'wellbeing',
      type: 'tip',
      title: 'Managing Decision Anxiety',
      message: 'Try relaxation techniques before important decisions. High anxiety can impact choice quality.',
      importance: 'medium'
    });
  }

  // Algorithm performance insights
  if (algorithmPerf.length >= 5) {
    const avgProcessingTime = algorithmPerf.reduce((sum, p) => sum + p.processingTime, 0) / algorithmPerf.length;
    
    if (avgProcessingTime < 1000) {
      insights.push({
        category: 'technology',
        type: 'observation',
        title: 'Fast AI Processing',
        message: 'AI algorithms are responding quickly to your queries',
        importance: 'low'
      });
    }
  }

  // Behavioral patterns
  if (behaviorData.length >= 20) {
    const avgHesitation = behaviorData
      .filter(b => b.hesitationTime)
      .reduce((sum, b) => sum + b.hesitationTime, 0) / behaviorData.filter(b => b.hesitationTime).length;
    
    if (avgHesitation > 180) { // 3 minutes
      insights.push({
        category: 'efficiency',
        type: 'tip',
        title: 'Decision Speed',
        message: 'You tend to deliberate carefully. Consider setting time limits for routine decisions.',
        importance: 'medium'
      });
    }
  }

  return insights;
}

async function getDecisionTrends(userId, fromDate, groupBy) {
  // This would implement time-series data aggregation
  // For now, return simplified trend data
  const decisions = await prisma.decision.findMany({
    where: {
      userId,
      createdAt: { gte: fromDate }
    },
    select: {
      createdAt: true,
      decisionType: true
    }
  });

  // Group by time period and return trend data
  return groupDecisionsByPeriod(decisions, groupBy);
}

async function getSatisfactionTrends(userId, fromDate, groupBy) {
  const decisions = await prisma.decision.findMany({
    where: {
      userId,
      createdAt: { gte: fromDate },
      outcomeRating: { not: null }
    },
    select: {
      createdAt: true,
      outcomeRating: true
    }
  });

  return groupSatisfactionByPeriod(decisions, groupBy);
}

async function getSpeedTrends(userId, fromDate, groupBy) {
  const behavior = await prisma.userBehavior.findMany({
    where: {
      userId,
      createdAt: { gte: fromDate },
      hesitationTime: { not: null }
    },
    select: {
      createdAt: true,
      hesitationTime: true
    }
  });

  return groupSpeedByPeriod(behavior, groupBy);
}

function groupDecisionsByPeriod(decisions, groupBy) {
  // Simplified grouping implementation
  const groups = {};
  
  decisions.forEach(decision => {
    const date = new Date(decision.createdAt);
    let key;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else { // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { date: key, count: 0, types: {} };
    }
    
    groups[key].count++;
    groups[key].types[decision.decisionType] = (groups[key].types[decision.decisionType] || 0) + 1;
  });
  
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

function groupSatisfactionByPeriod(decisions, groupBy) {
  // Similar grouping for satisfaction ratings
  const groups = {};
  
  decisions.forEach(decision => {
    const date = new Date(decision.createdAt);
    let key;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { date: key, ratings: [] };
    }
    
    groups[key].ratings.push(decision.outcomeRating);
  });
  
  // Calculate averages
  return Object.values(groups).map(group => ({
    date: group.date,
    avgRating: group.ratings.reduce((a, b) => a + b, 0) / group.ratings.length,
    count: group.ratings.length
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function groupSpeedByPeriod(behavior, groupBy) {
  // Similar grouping for hesitation times
  const groups = {};
  
  behavior.forEach(item => {
    const date = new Date(item.createdAt);
    let key;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { date: key, times: [] };
    }
    
    groups[key].times.push(item.hesitationTime);
  });
  
  // Calculate averages
  return Object.values(groups).map(group => ({
    date: group.date,
    avgHesitation: group.times.reduce((a, b) => a + b, 0) / group.times.length,
    count: group.times.length
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateTrendSummary(trendData) {
  if (trendData.length < 2) {
    return { direction: 'insufficient_data', change: 0 };
  }
  
  const first = trendData[0];
  const last = trendData[trendData.length - 1];
  
  let direction, change;
  
  if ('count' in first) {
    change = ((last.count - first.count) / first.count) * 100;
  } else if ('avgRating' in first) {
    change = ((last.avgRating - first.avgRating) / first.avgRating) * 100;
  } else if ('avgHesitation' in first) {
    change = ((last.avgHesitation - first.avgHesitation) / first.avgHesitation) * 100;
  }
  
  if (Math.abs(change) < 5) direction = 'stable';
  else if (change > 0) direction = 'increasing';
  else direction = 'decreasing';
  
  return { direction, change: Math.round(change) };
}

function calculateReliabilityScore(decisions, behaviorData) {
  const decisionScore = Math.min(100, decisions.length * 2);
  const behaviorScore = Math.min(100, behaviorData.length);
  return Math.round((decisionScore + behaviorScore) / 2);
}

async function exportDecisionsData(userId) {
  const decisions = await prisma.decision.findMany({
    where: { userId },
    include: { options: true },
    orderBy: { createdAt: 'desc' }
  });

  const header = 'Date,Type,Title,Description,Chosen Option,Confidence Score,Outcome Rating,Options Count\n';
  
  const rows = decisions.map(d => {
    return [
      new Date(d.createdAt).toISOString(),
      d.decisionType,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
      `"${(d.chosenOption || '').replace(/"/g, '""')}"`,
      d.confidenceScore || '',
      d.outcomeRating || '',
      d.options.length
    ].join(',');
  }).join('\n');

  return header + rows;
}

async function exportAnalyticsData(userId) {
  // Export comprehensive analytics data
  const [decisions, algorithms, behavior] = await Promise.all([
    prisma.decision.count({ where: { userId } }),
    prisma.algorithmPerformance.count({ where: { userId } }),
    prisma.userBehavior.count({ where: { userId } })
  ]);

  const header = 'Metric,Value\n';
  const rows = [
    `Total Decisions,${decisions}`,
    `Algorithm Runs,${algorithms}`,
    `Behavior Data Points,${behavior}`,
    `Export Date,"${new Date().toISOString()}"`
  ].join('\n');

  return header + rows;
}

export default router;
