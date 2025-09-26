import express from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import CodeReview from '../models/CodeReview.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's review history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { rows: reviews, count: total } = await CodeReview.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['originalCode', 'aiResponse'] }
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get specific review
router.get('/review/:id', optionalAuth, async (req, res) => {
  try {
    const review = await CodeReview.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId && (!req.user || review.userId !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Delete review
router.delete('/review/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await CodeReview.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalReviews = await CodeReview.count({ where: { userId } });
    
    const languageStats = await CodeReview.findAll({
      where: { userId },
      attributes: [
        'language',
        [sequelize.fn('COUNT', sequelize.col('language')), 'count']
      ],
      group: ['language'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    const recentActivity = await CodeReview.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 7,
      attributes: ['createdAt', 'reviewType']
    });

    res.json({
      totalReviews,
      languageStats,
      recentActivity,
      avgQualityScore: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;