import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const execAsync = promisify(exec);

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:3456',
    'https://codesenseai.netlify.app',
    'https://ai-code-review-lmle.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers for OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Extract user ID from token
    if (token.startsWith('token-')) {
      const userId = parseInt(token.split('-')[1]);
      req.userId = userId;
    } else if (token.startsWith('google-token-')) {
      const userId = parseInt(token.split('-')[2]);
      req.userId = userId;
    } else {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Simple code analyzer
class CodeAnalyzer {
  static analyzeCode(code, language) {
    const issues = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;
      
      if (language === 'javascript') {
        if (trimmed.includes('console.log') && !trimmed.endsWith(';')) {
          issues.push({
            line: lineNum,
            severity: 'medium',
            category: 'syntax',
            message: 'Missing semicolon',
            suggestion: 'Add semicolon at end of statement'
          });
        }
      }
      
      if (language === 'python') {
        if (trimmed.includes('print') && !trimmed.includes('print(')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: 'Invalid print syntax',
            suggestion: 'Use print() function'
          });
        }
      }
    });
    
    return issues;
  }
}

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255),
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'sandbox',
        language VARCHAR(50) DEFAULT 'javascript',
        tags TEXT[],
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        workspace_id INTEGER,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        code TEXT,
        language VARCHAR(50),
        result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        folder VARCHAR(255) DEFAULT 'General',
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scratchpads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        workspace_id INTEGER,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Initialize database on startup
initDatabase();

// AI Chat endpoint with Gemini 2.5 Flash integration
app.post('/api/ai/chat', authenticateUser, async (req, res) => {
  const { message, codeContext, workspaceId } = req.body;
  
  try {
    let response;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        let prompt = `You are an expert AI coding assistant. Provide helpful, accurate, and concise responses about programming and software development.

User question: ${message}`;
        
        if (codeContext && codeContext.trim()) {
          prompt += `

Code context:
\`\`\`
${codeContext}
\`\`\``;
        }
        
        prompt += `

Provide a clear, helpful response. If analyzing code, be specific about issues and solutions. Keep responses focused and actionable.`;
        
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } catch (error) {
        console.error('Gemini API error:', error);
        response = `I'm having trouble connecting to the AI service right now. Here's what I can tell you about your question: "${message}". ${codeContext ? 'I can see you have code context provided. ' : ''}Please try again in a moment.`;
      }
    } else {
      response = `I understand you're asking: "${message}". ${codeContext ? 'I can see your code context. ' : ''}To get intelligent AI responses, please configure your GEMINI_API_KEY in the backend .env file.`;
    }
    
    // Save to history
    await pool.query(
      'INSERT INTO history (user_id, workspace_id, type, title, code, language, result) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.userId, workspaceId || null, 'chat', 'AI Chat', codeContext, null, JSON.stringify({ message, response })]
    );
    
    res.json({ response });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      response: 'Sorry, I encountered an error. Please try again or check if the AI service is properly configured.' 
    });
  }
});

// AI Debug endpoint with Gemini integration
app.post('/api/ai/debug', authenticateUser, async (req, res) => {
  const { code, language, workspaceId } = req.body;
  
  try {
    let response;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `You are an expert code debugger. Analyze the following ${language || 'code'} and identify bugs, errors, and issues.

Code to debug:
\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. List of bugs/issues found
2. Corrected code
3. Explanation of fixes

Format your response clearly with sections for issues and fixes.`;
        
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } catch (error) {
        console.error('Gemini debug error:', error);
        response = 'AI debugging service is temporarily unavailable. Please check your code manually for syntax errors, missing semicolons, undefined variables, and logic issues.';
      }
    } else {
      response = 'AI debugging requires GEMINI_API_KEY configuration. Please check your code for common issues like syntax errors, missing semicolons, and undefined variables.';
    }
    
    // Save to history
    await pool.query(
      'INSERT INTO history (user_id, workspace_id, type, title, code, language, result) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.userId, workspaceId || null, 'debug', 'Code Debug', code, language, JSON.stringify({ response })]
    );
    
    res.json({ response, language });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: 'Failed to debug code',
      response: 'Sorry, I encountered an error while debugging. Please try again.' 
    });
  }
});

// AI Optimize endpoint
app.post('/api/ai/optimize', authenticateUser, async (req, res) => {
  const { code, language, workspaceId } = req.body;
  
  try {
    let response;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `You are an expert code optimizer. Analyze the following ${language || 'code'} and suggest optimizations for performance, readability, and best practices.

Code to optimize:
\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. Performance improvements
2. Code quality enhancements
3. Best practices recommendations
4. Optimized version of the code

Focus on practical, actionable improvements.`;
        
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } catch (error) {
        console.error('Gemini optimize error:', error);
        response = 'AI optimization service is temporarily unavailable. Consider reviewing your code for performance bottlenecks, redundant operations, and opportunities to use more efficient algorithms.';
      }
    } else {
      response = 'AI optimization requires GEMINI_API_KEY configuration. Consider reviewing your code for performance improvements and best practices.';
    }
    
    // Save to history
    await pool.query(
      'INSERT INTO history (user_id, workspace_id, type, title, code, language, result) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.userId, workspaceId || null, 'optimize', 'Code Optimization', code, language, JSON.stringify({ response })]
    );
    
    res.json({ response, language });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ 
      error: 'Failed to optimize code',
      response: 'Sorry, I encountered an error while optimizing. Please try again.' 
    });
  }
});

// AI Review endpoint
app.post('/api/ai/review', authenticateUser, async (req, res) => {
  try {
    const { code, language, workspaceId } = req.body;
    const issues = CodeAnalyzer.analyzeCode(code, language);

    if (issues.length === 0) {
      issues.push({
        line: 1,
        severity: 'info',
        category: 'general',
        message: `✅ ${(language || 'Code').toUpperCase()} syntax is correct`,
        suggestion: 'No issues detected'
      });
    }

    const errorCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    const qualityScore = Math.max(30, 100 - (errorCount * 20) - (warningCount * 10));

    const result = {
      reviewId: 'review-' + Date.now(),
      language: language || 'javascript',
      qualityScore,
      issues,
      summary: issues.length === 1 && issues[0].severity === 'info' ? 'Code quality is excellent' : `Found ${errorCount} error(s), ${warningCount} warning(s)`
    };

    // Save to history
    await pool.query(
      'INSERT INTO history (user_id, workspace_id, type, title, code, language, result) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.userId, workspaceId || null, 'review', 'Code Review', code, language, JSON.stringify(result)]
    );

    res.json(result);
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to review code' });
  }
});

// History endpoints
app.get('/api/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', type = '' } = req.query;
    
    let query = 'SELECT * FROM history WHERE user_id = $1';
    let params = [req.userId];
    let paramCount = 1;
    
    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    query += ` ORDER BY ${sortBy === 'title' ? 'title' : sortBy === 'type' ? 'type' : 'created_at DESC'}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM history WHERE user_id = $1';
    let countParams = [req.userId];
    if (search) {
      countQuery += ' AND (title ILIKE $2 OR code ILIKE $2)';
      countParams.push(`%${search}%`);
    }
    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({ 
      history: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        workspaceId: row.workspace_id,
        type: row.type,
        title: row.title,
        code: row.code,
        language: row.language,
        result: row.result,
        createdAt: row.created_at
      })),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Notes endpoints
app.get('/api/notes', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'updated_at', folder = '' } = req.query;
    
    let query = 'SELECT * FROM notes WHERE user_id = $1';
    let params = [req.userId];
    let paramCount = 1;
    
    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (folder && folder !== 'All') {
      paramCount++;
      query += ` AND folder = $${paramCount}`;
      params.push(folder);
    }
    
    const orderBy = sortBy === 'title' ? 'title' : sortBy === 'created_at' ? 'created_at DESC' : 'updated_at DESC';
    query += ` ORDER BY ${orderBy}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM notes WHERE user_id = $1';
    let countParams = [req.userId];
    if (search) {
      countQuery += ' AND (title ILIKE $2 OR content ILIKE $2)';
      countParams.push(`%${search}%`);
    }
    if (folder && folder !== 'All') {
      countQuery += ` AND folder = $${countParams.length + 1}`;
      countParams.push(folder);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({ 
      notes: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        folder: row.folder,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', authenticateUser, async (req, res) => {
  try {
    const { title, content, folder, tags = [] } = req.body;
    
    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content, folder, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, title, content, folder || 'General', tags]
    );
    
    const note = result.rows[0];
    res.status(201).json({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    console.error('Note creation error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content, folder, tags } = req.body;
    
    const result = await pool.query(
      'UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content), folder = COALESCE($3, folder), tags = COALESCE($4, tags), updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, content, folder, tags, req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = result.rows[0];
    res.json({
      id: note.id,
      userId: note.user_id,
      title: note.title,
      content: note.content,
      folder: note.folder,
      tags: note.tags,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    });
  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Note delete error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Scratchpads endpoints
app.get('/api/scratchpads', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at' } = req.query;
    
    let query = 'SELECT * FROM scratchpads WHERE user_id = $1';
    let params = [req.userId];
    let paramCount = 1;
    
    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    const orderBy = sortBy === 'title' ? 'title' : sortBy === 'updated_at' ? 'updated_at DESC' : 'created_at DESC';
    query += ` ORDER BY ${orderBy}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM scratchpads WHERE user_id = $1';
    let countParams = [req.userId];
    if (search) {
      countQuery += ' AND (title ILIKE $2 OR content ILIKE $2)';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({ 
      scratchpads: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        workspaceId: row.workspace_id,
        title: row.title,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Scratchpads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch scratchpads' });
  }
});

app.post('/api/scratchpads', authenticateUser, async (req, res) => {
  try {
    const { workspaceId, title, content } = req.body;
    
    const result = await pool.query(
      'INSERT INTO scratchpads (user_id, workspace_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, workspaceId, title, content]
    );
    
    const scratchpad = result.rows[0];
    res.status(201).json({
      id: scratchpad.id,
      userId: scratchpad.user_id,
      workspaceId: scratchpad.workspace_id,
      title: scratchpad.title,
      content: scratchpad.content,
      createdAt: scratchpad.created_at,
      updatedAt: scratchpad.updated_at
    });
  } catch (error) {
    console.error('Scratchpad creation error:', error);
    res.status(500).json({ error: 'Failed to create scratchpad' });
  }
});

app.get('/api/scratchpads/:workspaceId', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scratchpads WHERE workspace_id = $1 AND user_id = $2',
      [req.params.workspaceId, req.userId]
    );
    
    res.json({ 
      scratchpads: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        workspaceId: row.workspace_id,
        title: row.title,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Workspace scratchpads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch scratchpads' });
  }
});

app.put('/api/scratchpads/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const result = await pool.query(
      'UPDATE scratchpads SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scratchpad not found' });
    }
    
    const scratchpad = result.rows[0];
    res.json({
      id: scratchpad.id,
      userId: scratchpad.user_id,
      workspaceId: scratchpad.workspace_id,
      title: scratchpad.title,
      content: scratchpad.content,
      createdAt: scratchpad.created_at,
      updatedAt: scratchpad.updated_at
    });
  } catch (error) {
    console.error('Scratchpad update error:', error);
    res.status(500).json({ error: 'Failed to update scratchpad' });
  }
});

app.delete('/api/scratchpads/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM scratchpads WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scratchpad not found' });
    }
    
    res.json({ message: 'Scratchpad deleted successfully' });
  } catch (error) {
    console.error('Scratchpad delete error:', error);
    res.status(500).json({ error: 'Failed to delete scratchpad' });
  }
});

// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify Google credential
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user = result.rows[0];
    
    if (!user) {
      // Create new user from Google data
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);
      result = await pool.query(
        'INSERT INTO users (full_name, username, email, google_id, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, username, email.toLowerCase(), googleId, picture]
      );
      user = result.rows[0];
    }
    
    res.json({
      message: `Welcome, ${user.full_name}!`,
      accessToken: 'google-token-' + user.id + '-' + Date.now(),
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate username from email
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (full_name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [fullName, username, email.toLowerCase(), password]
    );
    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Registration successful! You can now sign in.',
      token: 'token-' + newUser.id,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: "Account not found. Please register first.",
        needsSignup: true
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({
      message: `Welcome back, ${user.full_name}!`,
      token: 'token-' + user.id + '-' + Date.now(),
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Projects endpoints
app.get('/api/projects', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', type = '', language = '', sortBy = 'last_opened_at' } = req.query;
    
    let query = 'SELECT * FROM workspaces WHERE user_id = $1';
    let params = [req.userId];
    let paramCount = 1;
    
    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (type && type !== 'all') {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    if (language && language !== 'all') {
      paramCount++;
      query += ` AND language = $${paramCount}`;
      params.push(language);
    }
    
    const orderBy = sortBy === 'title' ? 'title' : sortBy === 'created' ? 'created_at DESC' : 'last_opened_at DESC';
    query += ` ORDER BY ${orderBy}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM workspaces WHERE user_id = $1';
    let countParams = [req.userId];
    if (search) {
      countQuery += ' AND (title ILIKE $2 OR description ILIKE $2)';
      countParams.push(`%${search}%`);
    }
    if (type && type !== 'all') {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    if (language && language !== 'all') {
      countQuery += ` AND language = $${countParams.length + 1}`;
      countParams.push(language);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      projects: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        type: row.type,
        language: row.language,
        tags: row.tags,
        content: row.content,
        createdAt: row.created_at,
        lastOpenedAt: row.last_opened_at
      })),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/stats', authenticateUser, async (req, res) => {
  try {
    const workspacesResult = await pool.query('SELECT COUNT(*) FROM workspaces WHERE user_id = $1', [req.userId]);
    const historyResult = await pool.query('SELECT COUNT(*) FROM history WHERE user_id = $1', [req.userId]);
    const weeklyResult = await pool.query(
      'SELECT COUNT(*) FROM history WHERE user_id = $1 AND created_at > $2',
      [req.userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
    );
    
    res.json({
      totalProjects: parseInt(workspacesResult.rows[0].count),
      totalAnalyses: parseInt(historyResult.rows[0].count),
      totalProblems: 0,
      weeklyActivity: parseInt(weeklyResult.rows[0].count)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/projects', authenticateUser, async (req, res) => {
  try {
    const { title, description, language = 'javascript', tags = [] } = req.body;
    
    const result = await pool.query(
      'INSERT INTO workspaces (user_id, title, description, type, language, tags, content) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.userId, title, description, 'sandbox', language, tags, getStarterCode(language)]
    );
    
    const workspace = result.rows[0];
    res.status(201).json({
      id: workspace.id,
      userId: workspace.user_id,
      title: workspace.title,
      description: workspace.description,
      type: workspace.type,
      language: workspace.language,
      tags: workspace.tags,
      content: workspace.content,
      createdAt: workspace.created_at,
      lastOpenedAt: workspace.last_opened_at
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    const workspace = result.rows[0];
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Update last opened time
    await pool.query('UPDATE workspaces SET last_opened_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
    
    res.json({
      id: workspace.id,
      userId: workspace.user_id,
      title: workspace.title,
      description: workspace.description,
      type: workspace.type,
      language: workspace.language,
      tags: workspace.tags,
      content: workspace.content,
      createdAt: workspace.created_at,
      lastOpenedAt: new Date().toISOString(),
      Files: [{
        id: 1,
        name: getDefaultFileName(workspace.language),
        content: workspace.content,
        language: workspace.language,
        isMain: true
      }]
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.put('/api/projects/:id', authenticateUser, async (req, res) => {
  try {
    const { title, description, tags, content, lastOpenedAt } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    if (title) {
      updates.push(`title = $${++paramCount}`);
      values.push(title);
    }
    if (description) {
      updates.push(`description = $${++paramCount}`);
      values.push(description);
    }
    if (tags) {
      updates.push(`tags = $${++paramCount}`);
      values.push(tags);
    }
    if (content) {
      updates.push(`content = $${++paramCount}`);
      values.push(content);
    }
    if (lastOpenedAt) {
      updates.push(`last_opened_at = $${++paramCount}`);
      values.push(lastOpenedAt);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id, req.userId);
    const query = `UPDATE workspaces SET ${updates.join(', ')} WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const workspace = result.rows[0];
    res.json({
      id: workspace.id,
      userId: workspace.user_id,
      title: workspace.title,
      description: workspace.description,
      type: workspace.type,
      language: workspace.language,
      tags: workspace.tags,
      content: workspace.content,
      createdAt: workspace.created_at,
      lastOpenedAt: workspace.last_opened_at
    });
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM workspaces WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Project delete error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Code execution endpoints
app.post('/api/execute/run', async (req, res) => {
  const { code, language, input } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  let command = '';
  let filePath = '';
  let inputPath = '';

  try {
    if (input) {
      inputPath = path.join(tempDir, `input_${timestamp}.txt`);
      fs.writeFileSync(inputPath, input);
    }

    switch (language) {
      case 'python':
        filePath = path.join(tempDir, `script_${timestamp}.py`);
        fs.writeFileSync(filePath, code);
        command = `python3 "${filePath}"`;
        if (input) command += ` < "${inputPath}"`;
        break;

      case 'javascript':
        filePath = path.join(tempDir, `script_${timestamp}.js`);
        fs.writeFileSync(filePath, code);
        command = `node "${filePath}"`;
        if (input) command += ` < "${inputPath}"`;
        break;

      case 'java':
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Main';
        filePath = path.join(tempDir, `${className}.java`);
        fs.writeFileSync(filePath, code);
        const classPath = tempDir;
        command = `javac "${filePath}" && java -cp "${classPath}" ${className}`;
        if (input) command += ` < "${inputPath}"`;
        break;

      case 'cpp':
      case 'c':
        const ext = language === 'cpp' ? 'cpp' : 'c';
        const compiler = language === 'cpp' ? 'g++' : 'gcc';
        filePath = path.join(tempDir, `program_${timestamp}.${ext}`);
        const outPath = path.join(tempDir, `program_${timestamp}.out`);
        fs.writeFileSync(filePath, code);
        command = `${compiler} "${filePath}" -o "${outPath}" && "${outPath}"`;
        if (input) command += ` < "${inputPath}"`;
        break;

      default:
        return res.status(400).json({ success: false, error: `Language ${language} execution not supported locally yet.` });
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

    // Cleanup
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (language === 'java' && fs.existsSync(path.join(tempDir, 'Main.class'))) fs.unlinkSync(path.join(tempDir, 'Main.class'));
      if ((language === 'cpp' || language === 'c') && fs.existsSync(path.join(tempDir, `program_${timestamp}.out`))) fs.unlinkSync(path.join(tempDir, `program_${timestamp}.out`));
    } catch (e) { console.error('Cleanup error', e); }

    res.json({
      success: true,
      output: stdout + (stderr ? `\nError Output:\n${stderr}` : '')
    });

  } catch (error) {
    console.error('Execution error:', error);
    res.json({
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout + '\n' + error.stderr : error.stderr || error.message
    });
  }
});

app.post('/api/execute/suggestions', (req, res) => {
  res.json({
    suggestions: {
      input: '',
      output: ''
    }
  });
});

// Helper functions
function getDefaultFileName(language) {
  const extensions = {
    javascript: 'main.js',
    typescript: 'main.ts',
    python: 'main.py',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c'
  };
  return extensions[language] || 'main.txt';
}

function getStarterCode(language) {
  const starters = {
    javascript: '// Welcome to your workspace\nconsole.log("Hello, World!");',
    python: '# Welcome to your workspace\nprint("Hello, World!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}'
  };
  return starters[language] || '// Welcome to your workspace';
}

// Trash endpoints
app.get('/api/trash', (req, res) => {
  const { page = 1, limit = 12, search = '', type = '', sortBy = 'deletedAt' } = req.query;
  
  try {
    let trashedItems = [];
    if (typeof localStorage !== 'undefined') {
      trashedItems = JSON.parse(localStorage.getItem('trashedItems') || '[]');
    }
    
    // Apply search filter
    if (search) {
      trashedItems = trashedItems.filter(item => 
        (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
        (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Apply type filter
    if (type && type !== 'all') {
      trashedItems = trashedItems.filter(item => item.type === type);
    }
    
    // Apply sorting
    trashedItems.sort((a, b) => {
      if (sortBy === 'title') return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return new Date(b.deletedAt) - new Date(a.deletedAt);
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = trashedItems.slice(startIndex, endIndex);
    
    res.json({
      items: paginatedItems,
      total: trashedItems.length,
      totalPages: Math.ceil(trashedItems.length / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.json({ items: [], total: 0, totalPages: 0, currentPage: 1 });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    res.json({
      message: 'AI Code Review API is running',
      status: 'OK',
      registeredUsers: userCount,
      endpoints: {
        auth: ['/api/auth/register', '/api/auth/login'],
        ai: ['/api/ai/review', '/api/ai/debug', '/api/ai/optimize', '/api/ai/chat']
      }
    });
  } catch (error) {
    res.json({
      message: 'AI Code Review API is running',
      status: 'OK',
      registeredUsers: 0,
      endpoints: {
        auth: ['/api/auth/register', '/api/auth/login'],
        ai: ['/api/ai/review', '/api/ai/debug', '/api/ai/optimize', '/api/ai/chat']
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to verify server is running`);
});