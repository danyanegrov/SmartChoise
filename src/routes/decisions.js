import express from 'express';
import Joi from 'joi';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';

const router = express.Router();

// Validation schemas
const simpleDecisionSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().min(1).max(255).required(),
      rating: Joi.number().integer().min(1).max(5).required()
    })
  ).min(2).max(5).required()
});

const complexDecisionSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  criteria: Joi.array().items(
    Joi.object({
      name: Joi.string().min(1).max(100).required(),
      weight: Joi.number().min(1).max(5).required()
    })
  ).min(1).max(5).required(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().min(1).max(255).required(),
      scores: Joi.array().items(
        Joi.number().min(1).max(5).required()
      ).required()
    })
  ).min(2).max(5).required()
});

const randomDecisionSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  options: Joi.array().items(
    Joi.string().min(1).max(255)
  ).min(2).max(8).required()
});

/**
 * POST /api/decisions/simple
 * Create a simple decision with emotion-aware AI
 */
router.post('/simple', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = simpleDecisionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  const { title, description, options } = value;

  // Create decision record
  const decision = await prisma.decision.create({
    data: {
      userId: req.user.id,
      decisionType: 'simple',
      title,
      description,
      contextData: {
        emotionAnalysis: req.body.emotionAnalysis || null,
        userContext: {
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay()
        }
      }
    }
  });

  // Create decision options
  const decisionOptions = await Promise.all(
    options.map(option => 
      prisma.decisionOption.create({
        data: {
          decisionId: decision.id,
          optionText: option.text,
          userRating: option.rating
        }
      })
    )
  );

  // Call ML service for recommendation (this would be implemented in ml routes)
  // For now, we'll simulate the AI recommendation
  const aiRecommendation = await simulateAIRecommendation(options, req.body.emotionAnalysis);

  // Update decision with AI choice
  const updatedDecision = await prisma.decision.update({
    where: { id: decision.id },
    data: {
      chosenOption: aiRecommendation.recommendedOption,
      confidenceScore: aiRecommendation.confidence
    },
    include: {
      options: true
    }
  });

  logger.info(`Simple decision created: ${title} by user ${req.user.email}`);

  res.status(201).json({
    message: 'Simple decision created successfully',
    decision: updatedDecision,
    aiRecommendation
  });
}));

/**
 * POST /api/decisions/complex
 * Create a complex decision with MCDA analysis
 */
router.post('/complex', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = complexDecisionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  const { title, description, criteria, options } = value;

  // Create decision record
  const decision = await prisma.decision.create({
    data: {
      userId: req.user.id,
      decisionType: 'complex',
      title,
      description,
      contextData: {
        criteria,
        mcdaMethod: 'AHP+TOPSIS'
      }
    }
  });

  // Create decision options with criteria scores
  const decisionOptions = await Promise.all(
    options.map(option => 
      prisma.decisionOption.create({
        data: {
          decisionId: decision.id,
          optionText: option.text,
          criteriaScores: {
            scores: option.scores,
            criteria: criteria
          }
        }
      })
    )
  );

  // Calculate MCDA results
  const mcdaResults = calculateMCDA(criteria, options);

  // Update decision with best option
  const updatedDecision = await prisma.decision.update({
    where: { id: decision.id },
    data: {
      chosenOption: mcdaResults.bestOption.text,
      confidenceScore: mcdaResults.bestOption.score
    },
    include: {
      options: true
    }
  });

  logger.info(`Complex decision created: ${title} by user ${req.user.email}`);

  res.status(201).json({
    message: 'Complex decision created successfully',
    decision: updatedDecision,
    mcdaResults
  });
}));

/**
 * POST /api/decisions/random
 * Create a random decision
 */
router.post('/random', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = randomDecisionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => detail.message)
    });
  }

  const { title, description, options } = value;

  // Select random option
  const randomIndex = Math.floor(Math.random() * options.length);
  const chosenOption = options[randomIndex];

  // Create decision record
  const decision = await prisma.decision.create({
    data: {
      userId: req.user.id,
      decisionType: 'random',
      title,
      description,
      chosenOption,
      contextData: {
        allOptions: options,
        randomSeed: Math.random()
      }
    }
  });

  // Create decision options
  const decisionOptions = await Promise.all(
    options.map(optionText => 
      prisma.decisionOption.create({
        data: {
          decisionId: decision.id,
          optionText
        }
      })
    )
  );

  const updatedDecision = await prisma.decision.findUnique({
    where: { id: decision.id },
    include: { options: true }
  });

  logger.info(`Random decision created: ${title} by user ${req.user.email}`);

  res.status(201).json({
    message: 'Random decision created successfully',
    decision: updatedDecision,
    randomResult: {
      chosenOption,
      chosenIndex: randomIndex
    }
  });
}));

/**
 * GET /api/decisions/history
 * Get user's decision history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;

  const where = {
    userId: req.user.id
  };

  if (type && ['simple', 'complex', 'random'].includes(type)) {
    where.decisionType = type;
  }

  const decisions = await prisma.decision.findMany({
    where,
    include: {
      options: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: Math.min(parseInt(limit), 100),
    skip: parseInt(offset)
  });

  const total = await prisma.decision.count({ where });

  res.json({
    decisions,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    }
  });
}));

/**
 * GET /api/decisions/:id
 * Get specific decision details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const decision = await prisma.decision.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: {
      options: true
    }
  });

  if (!decision) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Decision not found'
    });
  }

  res.json({ decision });
}));

/**
 * PUT /api/decisions/:id/outcome
 * Rate the outcome of a decision
 */
router.put('/:id/outcome', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Rating must be between 1 and 5'
    });
  }

  const decision = await prisma.decision.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!decision) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Decision not found'
    });
  }

  const updatedDecision = await prisma.decision.update({
    where: { id },
    data: { outcomeRating: rating },
    include: { options: true }
  });

  logger.info(`Decision outcome rated: ${id} - ${rating} stars by user ${req.user.email}`);

  res.json({
    message: 'Decision outcome rated successfully',
    decision: updatedDecision
  });
}));

// Helper functions (these would eventually be moved to ML service)
async function simulateAIRecommendation(options, emotionAnalysis) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simple recommendation logic based on ratings
  const bestOption = options.reduce((best, current) => 
    current.rating > best.rating ? current : best
  );

  // Apply emotion-based adjustments
  let confidence = (bestOption.rating / 5) * 100;
  
  if (emotionAnalysis?.emotion === 'anxiety') {
    confidence *= 0.9; // Lower confidence for anxious users
  } else if (emotionAnalysis?.emotion === 'confidence') {
    confidence *= 1.1; // Higher confidence for confident users
  }

  return {
    recommendedOption: bestOption.text,
    confidence: Math.min(95, Math.max(60, confidence)),
    reasoning: `Based on your highest rating (${bestOption.rating}/5) and emotional context`,
    emotionAdjustment: emotionAnalysis?.emotion || 'neutral'
  };
}

function calculateMCDA(criteria, options) {
  // Simplified AHP + TOPSIS implementation
  
  // Normalize criteria weights
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const normalizedWeights = criteria.map(c => c.weight / totalWeight);

  // Calculate weighted scores for each option
  const scoredOptions = options.map(option => {
    const weightedScore = option.scores.reduce((sum, score, index) => 
      sum + (score * normalizedWeights[index]), 0
    );
    
    return {
      text: option.text,
      score: weightedScore / criteria.length,
      scores: option.scores
    };
  });

  // Sort by score
  scoredOptions.sort((a, b) => b.score - a.score);

  return {
    bestOption: scoredOptions[0],
    allOptions: scoredOptions,
    normalizedWeights,
    method: 'AHP+TOPSIS'
  };
}

export default router;
