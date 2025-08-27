import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';
import databaseService from '../services/databaseService.js';

const router = express.Router();

/**
 * GET /api/database/stats
 * Get database statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await databaseService.getDatabaseStats();
  
  res.json({
    success: true,
    data: stats,
    message: 'Database statistics retrieved successfully'
  });
}));

/**
 * GET /api/database/categories
 * Get all decision categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await databaseService.getCategories();
  
  res.json({
    success: true,
    data: categories,
    message: 'Categories retrieved successfully'
  });
}));

/**
 * GET /api/database/criteria
 * Get all decision criteria
 */
router.get('/criteria', asyncHandler(async (req, res) => {
  const { category } = req.query;
  let criteria = await databaseService.getCriteria();
  
  if (category) {
    criteria = criteria.filter(c => c.category === category);
  }
  
  res.json({
    success: true,
    data: criteria,
    message: 'Criteria retrieved successfully'
  });
}));

/**
 * GET /api/database/decisions/category/:category
 * Get decisions by category
 */
router.get('/decisions/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { limit = 50 } = req.query;
  
  const decisions = await databaseService.getDecisionsByCategory(category, parseInt(limit));
  
  res.json({
    success: true,
    data: decisions,
    message: `Decisions for category '${category}' retrieved successfully`
  });
}));

/**
 * GET /api/database/decisions/scenario
 * Search decisions by scenario
 */
router.get('/decisions/scenario', asyncHandler(async (req, res) => {
  const { q: query, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter "q" is required'
    });
  }
  
  const decisions = await databaseService.getDecisionsByScenario(query, parseInt(limit));
  
  res.json({
    success: true,
    data: decisions,
    message: `Decisions matching '${query}' retrieved successfully`
  });
}));

/**
 * GET /api/database/decisions/similar
 * Get similar decisions based on criteria
 */
router.get('/decisions/similar', asyncHandler(async (req, res) => {
  const { criteria, limit = 10 } = req.query;
  
  if (!criteria) {
    return res.status(400).json({
      success: false,
      error: 'Criteria parameter is required'
    });
  }
  
  let criteriaObj;
  try {
    criteriaObj = JSON.parse(criteria);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid criteria format. Must be valid JSON'
    });
  }
  
  const decisions = await databaseService.getSimilarDecisions(criteriaObj, parseInt(limit));
  
  res.json({
    success: true,
    data: decisions,
    message: 'Similar decisions retrieved successfully'
  });
}));

/**
 * GET /api/database/decisions/:id/evaluations
 * Get expert evaluations for a decision
 */
router.get('/decisions/:id/evaluations', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const evaluations = await databaseService.getExpertEvaluations(id);
  
  res.json({
    success: true,
    data: evaluations,
    message: 'Expert evaluations retrieved successfully'
  });
}));

/**
 * GET /api/database/decisions/:id/outcome
 * Get decision outcome
 */
router.get('/decisions/:id/outcome', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const outcome = await databaseService.getDecisionOutcomes(id);
  
  if (!outcome) {
    return res.status(404).json({
      success: false,
      error: 'Decision outcome not found'
    });
  }
  
  res.json({
    success: true,
    data: outcome,
    message: 'Decision outcome retrieved successfully'
  });
}));

/**
 * GET /api/database/users/profiles
 * Get user profiles
 */
router.get('/users/profiles', asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  
  const profiles = await databaseService.getUserProfiles(parseInt(limit));
  
  res.json({
    success: true,
    data: profiles,
    message: 'User profiles retrieved successfully'
  });
}));

/**
 * POST /api/database/recommendations
 * Get personalized recommendations
 */
router.post('/recommendations', asyncHandler(async (req, res) => {
  const { userProfile, context, limit = 5 } = req.body;
  
  if (!userProfile) {
    return res.status(400).json({
      success: false,
      error: 'User profile is required'
    });
  }
  
  const recommendations = await databaseService.getRecommendations(
    userProfile, 
    context, 
    parseInt(limit)
  );
  
  res.json({
    success: true,
    data: recommendations,
    message: 'Recommendations generated successfully'
  });
}));

/**
 * POST /api/database/decisions/analyze
 * Analyze decision using database knowledge
 */
router.post('/decisions/analyze', asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    options, 
    userProfile, 
    context,
    criteria 
  } = req.body;
  
  if (!title || !options || options.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Title and at least 2 options are required'
    });
  }
  
  // Find similar decisions in database
  const similarDecisions = criteria ? 
    await databaseService.getSimilarDecisions(criteria, 5) :
    await databaseService.getDecisionsByScenario(title, 5);
  
  // Get recommendations based on user profile
  const recommendations = await databaseService.getRecommendations(
    userProfile, 
    context, 
    3
  );
  
  // Analyze options based on database knowledge
  const analyzedOptions = options.map(option => {
    const similarInDB = similarDecisions.find(d => 
      d.alternative.toLowerCase().includes(option.text.toLowerCase()) ||
      option.text.toLowerCase().includes(d.alternative.toLowerCase())
    );
    
    let score = 5; // Default score
    let reasoning = 'Based on general decision patterns';
    
    if (similarInDB) {
      score = similarInDB.metrics.overallScore || 5;
      reasoning = `Similar decisions in database show ${score}/10 rating`;
      
      if (similarInDB.outcome) {
        reasoning += `. Historical satisfaction: ${similarInDB.outcome.satisfaction}/10`;
      }
    }
    
    // Adjust score based on user profile
    if (userProfile?.anxietyLevel) {
      const anxiety = userProfile.anxietyLevel;
      if (anxiety > 7) {
        score = Math.max(1, score - 1); // Lower score for anxious users
        reasoning += '. Adjusted for anxiety level';
      }
    }
    
    return {
      text: option.text,
      score: Math.max(1, Math.min(10, score)),
      reasoning,
      databaseInsights: similarInDB ? {
        category: similarInDB.category,
        scenario: similarInDB.scenario,
        factors: similarInDB.factors,
        metrics: similarInDB.metrics
      } : null
    };
  });
  
  // Sort by score
  analyzedOptions.sort((a, b) => b.score - a.score);
  
  // Get expert insights if available
  const expertInsights = similarDecisions.length > 0 ? 
    await databaseService.getExpertEvaluations(similarDecisions[0].id) : 
    [];
  
  res.json({
    success: true,
    data: {
      title,
      description,
      options: analyzedOptions,
      recommendations: recommendations.slice(0, 3),
      expertInsights: expertInsights.slice(0, 2),
      databaseStats: {
        similarDecisionsFound: similarDecisions.length,
        totalRecommendations: recommendations.length,
        expertInsightsAvailable: expertInsights.length
      }
    },
    message: 'Decision analysis completed successfully'
  });
}));

/**
 * GET /api/database/search
 * Search across all database content
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q: query, type, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter "q" is required'
    });
  }
  
  const results = {
    decisions: [],
    categories: [],
    criteria: [],
    users: []
  };
  
  // Search decisions
  if (!type || type === 'decisions') {
    results.decisions = await databaseService.getDecisionsByScenario(query, Math.floor(limit / 2));
  }
  
  // Search categories
  if (!type || type === 'categories') {
    const categories = await databaseService.getCategories();
    results.categories = categories.filter(cat => 
      cat.name.toLowerCase().includes(query.toLowerCase()) ||
      cat.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Search criteria
  if (!type || type === 'criteria') {
    const criteria = await databaseService.getCriteria();
    results.criteria = criteria.filter(crit => 
      crit.name.toLowerCase().includes(query.toLowerCase()) ||
      crit.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Search user profiles
  if (!type || type === 'users') {
    const profiles = await databaseService.getUserProfiles(100);
    results.users = profiles.filter(profile => 
      profile.employment?.toLowerCase().includes(query.toLowerCase()) ||
      profile.region?.toLowerCase().includes(query.toLowerCase()) ||
      profile.education?.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  
  res.json({
    success: true,
    data: {
      query,
      results,
      totalResults,
      searchTypes: ['decisions', 'categories', 'criteria', 'users']
    },
    message: `Search completed. Found ${totalResults} results for '${query}'`
  });
}));

/**
 * POST /api/database/cache/clear
 * Clear database cache
 */
router.post('/cache/clear', asyncHandler(async (req, res) => {
  databaseService.clearCache();
  
  res.json({
    success: true,
    message: 'Database cache cleared successfully'
  });
}));

export default router;
