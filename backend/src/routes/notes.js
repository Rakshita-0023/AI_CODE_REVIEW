import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import Note from '../models/Note.js';
import User from '../models/User.js';

const router = express.Router();

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

// Get all notes for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, tags, folder, sortBy = 'lastModified', sortOrder = 'DESC' } = req.query;
    
    let where = { userId: req.user.id };
    
    // Search functionality
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = {
        [Op.contains]: tagArray
      };
    }
    
    // Filter by folder
    if (folder) {
      where.folder = folder;
    }
    
    const notes = await Note.findAll({
      where,
      order: [
        ['isPinned', 'DESC'], // Pinned notes first
        [sortBy, sortOrder]
      ],
    });

    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create new note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, color, folder } = req.body;

    const note = await Note.create({
      userId: req.user.id,
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      color: color || 'default',
      folder: folder || null,
    });

    res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, color, folder, isPinned } = req.body;

    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await note.update({
      title: title !== undefined ? title : note.title,
      content: content !== undefined ? content : note.content,
      tags: tags !== undefined ? tags : note.tags,
      color: color !== undefined ? color : note.color,
      folder: folder !== undefined ? folder : note.folder,
      isPinned: isPinned !== undefined ? isPinned : note.isPinned,
    });

    res.json({
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Note.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get user's folders
router.get('/folders/list', authenticateToken, async (req, res) => {
  try {
    const folders = await Note.findAll({
      where: {
        userId: req.user.id,
        folder: { [Op.not]: null }
      },
      attributes: ['folder'],
      group: ['folder'],
      raw: true,
    });

    const folderList = folders.map(f => f.folder).filter(Boolean);
    res.json({ folders: folderList });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get user's tags
router.get('/tags/list', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { userId: req.user.id },
      attributes: ['tags'],
      raw: true,
    });

    const allTags = notes.flatMap(note => note.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    res.json({ tags: uniqueTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;