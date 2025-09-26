import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Analysis from '../models/Analysis.js';
import User from '../models/User.js';

const router = express.Router();

// Debug endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'History routes working', timestamp: new Date().toISOString() });
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Save analysis to history
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { type, language, originalCode, result, qualityScore, processingTime } = req.body;

    if (!type || !language || !originalCode || !result) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await Analysis.create({
      userId: req.user.id,
      type,
      language,
      originalCode,
      result,
      qualityScore: qualityScore || null,
      processingTime: processingTime || 0,
    });

    res.status(201).json({
      message: 'Analysis saved to history',
      analysis: {
        id: analysis.id,
        type: analysis.type,
        language: analysis.language,
        qualityScore: analysis.qualityScore,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

// Get user's analysis history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, language } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (language) where.language = language;

    const { count, rows: analyses } = await Analysis.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'type',
        'language',
        'originalCode',
        'qualityScore',
        'processingTime',
        'createdAt',
      ],
    });

    res.json({
      analyses: analyses.map(analysis => ({
        ...analysis.toJSON(),
        codePreview: analysis.originalCode.substring(0, 100) + (analysis.originalCode.length > 100 ? '...' : ''),
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get specific analysis by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Delete analysis from history
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Analysis.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted from history' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

// Get user analytics
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const totalAnalyses = await Analysis.count({
      where: { userId: req.user.id },
    });

    const analysesByType = await Analysis.findAll({
      where: { userId: req.user.id },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('type')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    const analysesByLanguage = await Analysis.findAll({
      where: { userId: req.user.id },
      attributes: [
        'language',
        [sequelize.fn('COUNT', sequelize.col('language')), 'count'],
      ],
      group: ['language'],
      raw: true,
    });

    const avgQualityScore = await Analysis.findOne({
      where: { 
        userId: req.user.id,
        qualityScore: { [Op.not]: null },
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('qualityScore')), 'avgScore'],
      ],
      raw: true,
    });

    res.json({
      totalAnalyses,
      analysesByType: analysesByType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      analysesByLanguage: analysesByLanguage.reduce((acc, item) => {
        acc[item.language] = parseInt(item.count);
        return acc;
      }, {}),
      averageQualityScore: avgQualityScore?.avgScore ? Math.round(avgQualityScore.avgScore) : null,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;