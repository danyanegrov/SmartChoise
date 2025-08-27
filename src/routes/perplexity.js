import express from 'express';
import perplexityService from '../services/perplexityService.js';

const router = express.Router();

// Test Perplexity API connection
router.get('/test', async (req, res) => {
    try {
        const result = await perplexityService.query('Hello, this is a test message.');
        res.json({
            success: true,
            message: 'Perplexity API is working correctly',
            testResult: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get decision insights using Perplexity
router.post('/insights', async (req, res) => {
    try {
        const { decision, context } = req.body;
        
        if (!decision) {
            return res.status(400).json({
                success: false,
                error: 'Decision text is required'
            });
        }

        const result = await perplexityService.getDecisionInsights(decision, context || '');
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get market analysis
router.post('/market-analysis', async (req, res) => {
    try {
        const { topic } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Topic is required'
            });
        }

        const result = await perplexityService.getMarketAnalysis(topic);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get expert advice
router.post('/expert-advice', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Question is required'
            });
        }

        const result = await perplexityService.getExpertAdvice(question);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Custom query
router.post('/query', async (req, res) => {
    try {
        const { query, model } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const result = await perplexityService.query(query, model);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
