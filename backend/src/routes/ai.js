import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import aiService from '../services/aiService.js';
import CodeReview from '../models/CodeReview.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Review code
router.post('/review', optionalAuth, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detectedLanguage = language === 'auto' ? aiService.detectLanguage(code) : language;
    const startTime = Date.now();
    
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'review');
    const processingTime = Date.now() - startTime;

    const review = await CodeReview.create({
      userId: req.user?.id,
      sessionId: uuidv4(),
      originalCode: code,
      language: detectedLanguage,
      reviewType: 'review',
      aiResponse: {
        review: analysis.summary,
        qualityScore: analysis.qualityScore,
        issues: analysis.issues
      },
      metadata: {
        processingTime,
        aiProvider: 'gemini',
        codeLength: code.length
      }
    });

    res.json({
      reviewId: review.id,
      sessionId: review.sessionId,
      language: detectedLanguage,
      qualityScore: analysis.qualityScore,
      issues: analysis.issues,
      summary: analysis.summary,
      processingTime
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Code review failed' });
  }
});

// Debug code
router.post('/debug', optionalAuth, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detectedLanguage = language === 'auto' ? aiService.detectLanguage(code) : language;
    const startTime = Date.now();
    
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'debug');
    const processingTime = Date.now() - startTime;

    const review = await CodeReview.create({
      userId: req.user?.id,
      sessionId: uuidv4(),
      originalCode: code,
      language: detectedLanguage,
      reviewType: 'debug',
      aiResponse: {
        fixedCode: analysis.fixedCode,
        suggestions: analysis.bugs?.map(bug => bug.fix) || []
      },
      metadata: {
        processingTime,
        aiProvider: 'gemini',
        codeLength: code.length
      }
    });

    res.json({
      reviewId: review.id,
      sessionId: review.sessionId,
      language: detectedLanguage,
      bugs: analysis.bugs,
      fixedCode: analysis.fixedCode,
      explanation: analysis.explanation,
      processingTime
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Code debugging failed' });
  }
});

// Suggest approaches
router.post('/approaches', optionalAuth, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detectedLanguage = language === 'auto' ? aiService.detectLanguage(code) : language;
    const startTime = Date.now();
    
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'approaches');
    const processingTime = Date.now() - startTime;

    const review = await CodeReview.create({
      userId: req.user?.id,
      sessionId: uuidv4(),
      originalCode: code,
      language: detectedLanguage,
      reviewType: 'approaches',
      aiResponse: {
        alternatives: analysis.alternatives?.map(alt => alt.approach) || []
      },
      metadata: {
        processingTime,
        aiProvider: 'gemini',
        codeLength: code.length
      }
    });

    res.json({
      reviewId: review.id,
      sessionId: review.sessionId,
      language: detectedLanguage,
      alternatives: analysis.alternatives,
      processingTime
    });
  } catch (error) {
    console.error('Approaches error:', error);
    res.status(500).json({ error: 'Alternative approaches analysis failed' });
  }
});

// Optimize code
router.post('/optimize', optionalAuth, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const detectedLanguage = language === 'auto' ? aiService.detectLanguage(code) : language;
    const startTime = Date.now();
    
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'optimize');
    const processingTime = Date.now() - startTime;

    const review = await CodeReview.create({
      userId: req.user?.id,
      sessionId: uuidv4(),
      originalCode: code,
      language: detectedLanguage,
      reviewType: 'optimize',
      aiResponse: {
        optimizations: analysis.optimizations?.map(opt => opt.description) || []
      },
      metadata: {
        processingTime,
        aiProvider: 'gemini',
        codeLength: code.length
      }
    });

    res.json({
      reviewId: review.id,
      sessionId: review.sessionId,
      language: detectedLanguage,
      optimizations: analysis.optimizations,
      processingTime
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Code optimization failed' });
  }
});

// AI Chat endpoint
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are a helpful AI coding assistant. Respond to this user message: "${message}"`;
    
    const result = await aiService.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;