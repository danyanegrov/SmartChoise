import express from 'express';
import axios from 'axios';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';

const router = express.Router();

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * POST /api/ml/emotion-decision
 * Emotion-aware decision analysis
 */
router.post('/emotion-decision', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { text, options, userContext } = req.body;

  if (!text || !options || !Array.isArray(options)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Text and options array are required'
    });
  }

  try {
    // Analyze emotion using Hugging Face API
    const emotionResult = await analyzeEmotion(text);
    
    // Apply contextual bandit algorithm
    const recommendation = await applyContextualBandit(
      options, 
      emotionResult, 
      userContext || {},
      req.user
    );

    // Record algorithm performance
    await recordAlgorithmPerformance(
      req.user.id,
      'emotion-decision',
      { text, options, userContext },
      { emotion: emotionResult, recommendation },
      Date.now() - startTime
    );

    logger.info(`Emotion-decision analysis completed for user ${req.user.email}`);

    res.json({
      emotion: emotionResult,
      recommendation,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Emotion-decision analysis error:', error);
    
    // Fallback to simple logic if ML service fails
    const fallbackRecommendation = getFallbackRecommendation(options);
    
    res.json({
      emotion: { emotion: 'neutral', confidence: 0.5 },
      recommendation: fallbackRecommendation,
      fallback: true,
      error: 'ML service unavailable, using fallback logic'
    });
  }
}));

/**
 * POST /api/ml/contextual-recommendation
 * Contextual neural bandit recommendations
 */
router.post('/contextual-recommendation', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { options, context, decisionHistory } = req.body;

  if (!options || !Array.isArray(options)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Options array is required'
    });
  }

  try {
    // Get user's decision history for context
    const userHistory = await getUserDecisionHistory(req.user.id);
    
    // Apply contextual bandit algorithm
    const recommendations = await applyAdvancedContextualBandit(
      options,
      context || {},
      userHistory,
      req.user
    );

    // Record performance
    await recordAlgorithmPerformance(
      req.user.id,
      'contextual-bandit',
      { options, context, historyCount: userHistory.length },
      { recommendations },
      Date.now() - startTime
    );

    logger.info(`Contextual recommendation completed for user ${req.user.email}`);

    res.json({
      recommendations,
      contextFactors: {
        userExperience: userHistory.length,
        timeOfDay: new Date().getHours(),
        userPersonality: req.user.personalityType,
        anxietyLevel: req.user.anxietyLevel
      },
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Contextual recommendation error:', error);
    
    // Fallback recommendation
    const fallbackRecommendations = options.map((option, index) => ({
      option: typeof option === 'string' ? option : option.text,
      confidence: Math.random() * 0.4 + 0.6, // 60-100%
      rank: index + 1
    }));

    res.json({
      recommendations: fallbackRecommendations,
      fallback: true,
      error: 'ML service unavailable, using fallback logic'
    });
  }
}));

/**
 * POST /api/ml/behavioral-analysis
 * Behavioral pattern analysis
 */
router.post('/behavioral-analysis', asyncHandler(async (req, res) => {
  const startTime = Date.now();

  try {
    // Get user behavior data
    const behaviorData = await prisma.userBehavior.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get decision performance data
    const decisionData = await prisma.decision.findMany({
      where: { 
        userId: req.user.id,
        outcomeRating: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Analyze patterns
    const patterns = analyzeBehavioralPatterns(behaviorData, decisionData, req.user);
    
    // Generate insights and recommendations
    const insights = generatePersonalInsights(patterns, req.user);

    // Record performance
    await recordAlgorithmPerformance(
      req.user.id,
      'behavioral-analysis',
      { 
        behaviorDataPoints: behaviorData.length,
        decisionDataPoints: decisionData.length
      },
      { patterns, insights },
      Date.now() - startTime
    );

    logger.info(`Behavioral analysis completed for user ${req.user.email}`);

    res.json({
      patterns,
      insights,
      dataQuality: {
        behaviorPoints: behaviorData.length,
        decisionPoints: decisionData.length,
        reliability: calculateDataReliability(behaviorData, decisionData)
      },
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Behavioral analysis error:', error);
    
    res.status(500).json({
      error: 'Analysis Error',
      message: 'Failed to analyze behavioral patterns'
    });
  }
}));

/**
 * POST /api/ml/track-behavior
 * Track user behavior for ML analysis
 */
router.post('/track-behavior', asyncHandler(async (req, res) => {
  const {
    sessionId,
    actionType,
    pageUrl,
    elementClicked,
    timeSpent,
    hesitationTime,
    metadata
  } = req.body;

  if (!actionType) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Action type is required'
    });
  }

  // Record behavior
  await prisma.userBehavior.create({
    data: {
      userId: req.user.id,
      sessionId: sessionId || 'unknown',
      actionType,
      pageUrl,
      elementClicked,
      timeSpent,
      hesitationTime,
      metadata
    }
  });

  res.status(201).json({
    message: 'Behavior tracked successfully'
  });
}));

// Helper functions

async function analyzeEmotion(text) {
  if (!HUGGINGFACE_API_KEY) {
    // Fallback emotion analysis
    return analyzeEmotionFallback(text);
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    const emotions = response.data[0];
    const dominantEmotion = emotions.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );

    return {
      emotion: dominantEmotion.label.toLowerCase(),
      confidence: dominantEmotion.score,
      allEmotions: emotions
    };

  } catch (error) {
    logger.warn('Hugging Face API error, using fallback:', error.message);
    return analyzeEmotionFallback(text);
  }
}

function analyzeEmotionFallback(text) {
  const emotionKeywords = {
    anxiety: ['worry', 'anxious', 'nervous', 'stress', 'concern', 'fear'],
    joy: ['happy', 'excited', 'great', 'amazing', 'wonderful', 'fantastic'],
    sadness: ['sad', 'disappointed', 'down', 'depressed', 'upset'],
    anger: ['angry', 'frustrated', 'mad', 'annoyed', 'irritated'],
    fear: ['scared', 'afraid', 'terrified', 'panic', 'worried'],
    neutral: ['okay', 'fine', 'normal', 'average', 'standard']
  };

  const lowerText = text.toLowerCase();
  const emotionScores = {};

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    emotionScores[emotion] = matches / keywords.length;
  }

  const dominantEmotion = Object.keys(emotionScores).reduce((a, b) => 
    emotionScores[a] > emotionScores[b] ? a : b
  );

  return {
    emotion: dominantEmotion,
    confidence: Math.max(0.3, emotionScores[dominantEmotion]),
    fallback: true
  };
}

async function applyContextualBandit(options, emotion, context, user) {
  // Simplified contextual bandit implementation
  const scoredOptions = options.map((option, index) => {
    let score = typeof option === 'object' ? (option.rating || 3) : 3;
    
    // Emotion adjustments
    if (emotion.emotion === 'anxiety' && score >= 4) {
      score *= 0.9; // Slightly prefer less risky options for anxious users
    } else if (emotion.emotion === 'joy' && score >= 4) {
      score *= 1.1; // Boost high-rated options for happy users
    }
    
    // User personality adjustments
    if (user.personalityType === 'introvert' && score <= 3) {
      score *= 1.1; // Introverts might prefer safer options
    }
    
    // Anxiety level adjustments
    if (user.anxietyLevel > 7 && score >= 4) {
      score *= 0.95; // High anxiety users get slightly more conservative recommendations
    }
    
    // Add some randomness for exploration
    score += (Math.random() - 0.5) * 0.2;
    
    return {
      option: typeof option === 'string' ? option : option.text,
      score: Math.max(1, Math.min(5, score)),
      confidence: Math.min(95, Math.max(60, score * 20)),
      factors: {
        emotionAdjustment: emotion.emotion,
        personalityAdjustment: user.personalityType,
        anxietyAdjustment: user.anxietyLevel
      }
    };
  });

  // Return best option
  const bestOption = scoredOptions.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return bestOption;
}

async function applyAdvancedContextualBandit(options, context, history, user) {
  // More advanced contextual bandit with user history
  const recommendations = options.map((option, index) => {
    let baseScore = 3; // Default neutral score
    
    // Historical success rate for similar decisions
    const similarDecisions = history.filter(d => 
      d.decisionType === context.decisionType || 
      d.title.toLowerCase().includes(context.keyword?.toLowerCase() || '')
    );
    
    if (similarDecisions.length > 0) {
      const avgRating = similarDecisions.reduce((sum, d) => 
        sum + (d.outcomeRating || 3), 0) / similarDecisions.length;
      baseScore = avgRating;
    }
    
    // Time-based adjustments
    const hour = new Date().getHours();
    if (hour < 10 || hour > 20) {
      baseScore *= 0.95; // Slightly lower confidence outside normal hours
    }
    
    // User experience adjustments
    const experienceBonus = Math.min(0.2, history.length * 0.01);
    baseScore += experienceBonus;
    
    const confidence = Math.min(95, Math.max(60, baseScore * 20));
    
    return {
      option: typeof option === 'string' ? option : option.text,
      confidence,
      rank: index + 1,
      factors: {
        historicalSuccess: similarDecisions.length,
        experienceLevel: history.length,
        timeOfDay: hour
      }
    };
  });

  // Sort by confidence
  recommendations.sort((a, b) => b.confidence - a.confidence);
  
  // Update rankings
  recommendations.forEach((rec, index) => {
    rec.rank = index + 1;
  });

  return recommendations;
}

async function getUserDecisionHistory(userId) {
  return await prisma.decision.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      decisionType: true,
      title: true,
      outcomeRating: true,
      createdAt: true,
      contextData: true
    }
  });
}

function analyzeBehavioralPatterns(behaviorData, decisionData, user) {
  const patterns = {
    decisionSpeed: calculateDecisionSpeed(behaviorData),
    preferredTime: calculatePreferredTime(decisionData),
    hesitationPatterns: calculateHesitationPatterns(behaviorData),
    successRate: calculateSuccessRate(decisionData),
    typePreference: calculateTypePreference(decisionData)
  };

  return patterns;
}

function calculateDecisionSpeed(behaviorData) {
  const hesitationTimes = behaviorData
    .filter(b => b.hesitationTime)
    .map(b => b.hesitationTime);
    
  if (hesitationTimes.length === 0) return 'unknown';
  
  const avgHesitation = hesitationTimes.reduce((a, b) => a + b, 0) / hesitationTimes.length;
  
  if (avgHesitation < 30) return 'fast';
  if (avgHesitation < 120) return 'moderate';
  return 'slow';
}

function calculatePreferredTime(decisionData) {
  const hourCounts = {};
  
  decisionData.forEach(d => {
    const hour = new Date(d.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[a] > hourCounts[b] ? a : b, '12'
  );
  
  const hour = parseInt(peakHour);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function calculateHesitationPatterns(behaviorData) {
  // Analyze patterns in hesitation behavior
  return {
    avgHesitation: behaviorData.reduce((sum, b) => sum + (b.hesitationTime || 0), 0) / behaviorData.length,
    consistency: 'moderate' // Simplified
  };
}

function calculateSuccessRate(decisionData) {
  const ratedDecisions = decisionData.filter(d => d.outcomeRating);
  if (ratedDecisions.length === 0) return 0;
  
  const successfulDecisions = ratedDecisions.filter(d => d.outcomeRating >= 4);
  return (successfulDecisions.length / ratedDecisions.length) * 100;
}

function calculateTypePreference(decisionData) {
  const typeCounts = {};
  decisionData.forEach(d => {
    typeCounts[d.decisionType] = (typeCounts[d.decisionType] || 0) + 1;
  });
  
  return Object.keys(typeCounts).reduce((a, b) => 
    typeCounts[a] > typeCounts[b] ? a : b, 'simple'
  );
}

function generatePersonalInsights(patterns, user) {
  const insights = [];
  
  if (patterns.decisionSpeed === 'fast') {
    insights.push({
      type: 'strength',
      message: 'You make decisions quickly and confidently',
      recommendation: 'Trust your instincts, but consider adding a brief reflection step for important decisions'
    });
  } else if (patterns.decisionSpeed === 'slow') {
    insights.push({
      type: 'improvement',
      message: 'You tend to take time with decisions',
      recommendation: 'Try setting time limits for less important decisions to build confidence'
    });
  }
  
  if (patterns.successRate > 80) {
    insights.push({
      type: 'strength',
      message: `Your decisions have a ${patterns.successRate.toFixed(0)}% success rate`,
      recommendation: 'Your decision-making process is working well - keep it up!'
    });
  }
  
  if (user.anxietyLevel > 7) {
    insights.push({
      type: 'tip',
      message: 'High anxiety can impact decision quality',
      recommendation: 'Try relaxation techniques before making important decisions'
    });
  }
  
  return insights;
}

function calculateDataReliability(behaviorData, decisionData) {
  const behaviorScore = Math.min(100, behaviorData.length * 2);
  const decisionScore = Math.min(100, decisionData.length * 4);
  return Math.round((behaviorScore + decisionScore) / 2);
}

function getFallbackRecommendation(options) {
  // Simple fallback when ML service is unavailable
  const randomIndex = Math.floor(Math.random() * options.length);
  const option = options[randomIndex];
  
  return {
    option: typeof option === 'string' ? option : option.text,
    confidence: Math.random() * 20 + 70, // 70-90%
    fallback: true
  };
}

async function recordAlgorithmPerformance(userId, algorithmType, inputData, outputData, processingTime) {
  try {
    await prisma.algorithmPerformance.create({
      data: {
        userId,
        algorithmType,
        inputData,
        outputData,
        processingTime
      }
    });
  } catch (error) {
    logger.error('Failed to record algorithm performance:', error);
  }
}

export default router;
