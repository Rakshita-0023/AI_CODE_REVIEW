import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const execAsync = promisify(exec);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3456'],
  credentials: true
}));
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

// Data storage
let users = [];
let workspaces = [];
let history = [];
let notes = [];
let scratchpads = [];

// File paths
const USERS_FILE = path.join(process.cwd(), 'users.json');
const WORKSPACES_FILE = path.join(process.cwd(), 'workspaces.json');
const HISTORY_FILE = path.join(process.cwd(), 'history.json');
const NOTES_FILE = path.join(process.cwd(), 'notes.json');
const SCRATCHPADS_FILE = path.join(process.cwd(), 'scratchpads.json');

// Load data functions
const loadData = () => {
  try {
    if (fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    if (fs.existsSync(WORKSPACES_FILE)) workspaces = JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf8'));
    if (fs.existsSync(HISTORY_FILE)) history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    if (fs.existsSync(NOTES_FILE)) notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    if (fs.existsSync(SCRATCHPADS_FILE)) scratchpads = JSON.parse(fs.readFileSync(SCRATCHPADS_FILE, 'utf8'));
  } catch (error) {
    console.log('Starting with fresh data');
  }
};

// Save data functions
const saveUsers = () => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const saveWorkspaces = () => fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(workspaces, null, 2));
const saveHistory = () => fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
const saveNotes = () => fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
const saveScratchpads = () => fs.writeFileSync(SCRATCHPADS_FILE, JSON.stringify(scratchpads, null, 2));

// Load initial data
loadData();

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
    const historyEntry = {
      id: Date.now(),
      userId: req.userId,
      workspaceId: workspaceId || null,
      type: 'chat',
      title: 'AI Chat',
      code: codeContext,
      language: null,
      result: { message, response },
      createdAt: new Date().toISOString()
    };
    history.push(historyEntry);
    saveHistory();
    
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
    const historyEntry = {
      id: Date.now(),
      userId: req.userId,
      workspaceId: workspaceId || null,
      type: 'debug',
      title: 'Code Debug',
      code,
      language,
      result: { response },
      createdAt: new Date().toISOString()
    };
    history.push(historyEntry);
    saveHistory();
    
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
    const historyEntry = {
      id: Date.now(),
      userId: req.userId,
      workspaceId: workspaceId || null,
      type: 'optimize',
      title: 'Code Optimization',
      code,
      language,
      result: { response },
      createdAt: new Date().toISOString()
    };
    history.push(historyEntry);
    saveHistory();
    
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
app.post('/api/ai/review', authenticateUser, (req, res) => {
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
  const historyEntry = {
    id: Date.now(),
    userId: req.userId,
    workspaceId: workspaceId || null,
    type: 'review',
    title: 'Code Review',
    code,
    language,
    result,
    createdAt: new Date().toISOString()
  };
  history.push(historyEntry);
  saveHistory();

  res.json(result);
});

// History endpoints
app.get('/api/history', authenticateUser, (req, res) => {
  const { page = 1, limit = 10, search = '', sortBy = 'createdAt', type = '' } = req.query;
  let userHistory = history.filter(h => h.userId === req.userId);
  
  // Apply search filter
  if (search) {
    userHistory = userHistory.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.result && JSON.stringify(item.result).toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  // Apply type filter
  if (type) {
    userHistory = userHistory.filter(item => item.type === type);
  }
  
  // Apply sorting
  userHistory.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedHistory = userHistory.slice(startIndex, endIndex);
  
  res.json({ 
    history: paginatedHistory,
    total: userHistory.length,
    totalPages: Math.ceil(userHistory.length / limit),
    currentPage: parseInt(page)
  });
});

// Notes endpoints
app.get('/api/notes', authenticateUser, (req, res) => {
  const { page = 1, limit = 10, search = '', sortBy = 'updatedAt', folder = '' } = req.query;
  let userNotes = notes.filter(n => n.userId === req.userId);
  
  // Apply search filter
  if (search) {
    userNotes = userNotes.filter(note => 
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Apply folder filter
  if (folder && folder !== 'All') {
    userNotes = userNotes.filter(note => note.folder === folder);
  }
  
  // Apply sorting
  userNotes.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedNotes = userNotes.slice(startIndex, endIndex);
  
  res.json({ 
    notes: paginatedNotes,
    total: userNotes.length,
    totalPages: Math.ceil(userNotes.length / limit),
    currentPage: parseInt(page)
  });
});

app.post('/api/notes', authenticateUser, (req, res) => {
  const { title, content, folder, tags = [] } = req.body;
  const note = {
    id: Date.now(),
    userId: req.userId,
    title,
    content,
    folder: folder || 'General',
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  notes.push(note);
  saveNotes();
  res.status(201).json(note);
});

app.put('/api/notes/:id', authenticateUser, (req, res) => {
  const { title, content, folder, tags } = req.body;
  const noteIndex = notes.findIndex(n => n.id == req.params.id && n.userId === req.userId);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title || notes[noteIndex].title,
    content: content || notes[noteIndex].content,
    folder: folder || notes[noteIndex].folder,
    tags: tags || notes[noteIndex].tags,
    updatedAt: new Date().toISOString()
  };
  
  saveNotes();
  res.json(notes[noteIndex]);
});

app.delete('/api/notes/:id', authenticateUser, (req, res) => {
  const noteIndex = notes.findIndex(n => n.id == req.params.id && n.userId === req.userId);
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes.splice(noteIndex, 1);
  saveNotes();
  res.json({ message: 'Note deleted successfully' });
});

// Scratchpads endpoints
app.get('/api/scratchpads', authenticateUser, (req, res) => {
  const { page = 1, limit = 10, search = '', sortBy = 'createdAt' } = req.query;
  let userScratchpads = scratchpads.filter(s => s.userId === req.userId);
  
  // Apply search filter
  if (search) {
    userScratchpads = userScratchpads.filter(scratchpad => 
      scratchpad.title.toLowerCase().includes(search.toLowerCase()) ||
      scratchpad.content.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Apply sorting
  userScratchpads.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'updatedAt') return new Date(b.updatedAt) - new Date(a.updatedAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedScratchpads = userScratchpads.slice(startIndex, endIndex);
  
  res.json({ 
    scratchpads: paginatedScratchpads,
    total: userScratchpads.length,
    totalPages: Math.ceil(userScratchpads.length / limit),
    currentPage: parseInt(page)
  });
});

app.post('/api/scratchpads', authenticateUser, (req, res) => {
  const { workspaceId, title, content } = req.body;
  const scratchpad = {
    id: Date.now(),
    userId: req.userId,
    workspaceId,
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  scratchpads.push(scratchpad);
  saveScratchpads();
  res.status(201).json(scratchpad);
});

app.get('/api/scratchpads/:workspaceId', (req, res) => {
  const workspaceScratchpads = scratchpads.filter(s => s.workspaceId == req.params.workspaceId);
  res.json({ scratchpads: workspaceScratchpads });
});

app.put('/api/scratchpads/:id', (req, res) => {
  const { title, content } = req.body;
  const scratchpadIndex = scratchpads.findIndex(s => s.id == req.params.id);
  
  if (scratchpadIndex === -1) {
    return res.status(404).json({ error: 'Scratchpad not found' });
  }
  
  scratchpads[scratchpadIndex] = {
    ...scratchpads[scratchpadIndex],
    title,
    content,
    updatedAt: new Date().toISOString()
  };
  
  saveScratchpads();
  res.json(scratchpads[scratchpadIndex]);
});

app.delete('/api/scratchpads/:id', (req, res) => {
  const scratchpadIndex = scratchpads.findIndex(s => s.id == req.params.id);
  if (scratchpadIndex === -1) {
    return res.status(404).json({ error: 'Scratchpad not found' });
  }
  
  scratchpads.splice(scratchpadIndex, 1);
  saveScratchpads();
  res.json({ message: 'Scratchpad deleted successfully' });
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
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Create new user from Google data
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);
      user = {
        id: Date.now(),
        fullName: name,
        username,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers();
    }
    
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      message: `Welcome, ${user.fullName}!`,
      accessToken: 'google-token-' + user.id + '-' + Date.now(),
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
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

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Generate username from email
  const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);

  const newUser = {
    id: Date.now(),
    fullName,
    username,
    email: email.toLowerCase(),
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();

  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    message: 'Registration successful! You can now sign in.',
    token: 'token-' + newUser.id,
    user: userWithoutPassword
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({
      error: "Account not found. Please register first.",
      needsSignup: true
    });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: `Welcome back, ${user.fullName}!`,
    token: 'token-' + user.id + '-' + Date.now(),
    user: userWithoutPassword
  });
});

// Projects endpoints
app.get('/api/projects', authenticateUser, (req, res) => {
  const { page = 1, limit = 12, search = '', type = '', language = '', sortBy = 'lastOpened' } = req.query;
  let userWorkspaces = workspaces.filter(w => w.userId === req.userId);
  
  // Apply search filter
  if (search) {
    userWorkspaces = userWorkspaces.filter(project => 
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  // Apply type filter
  if (type && type !== 'all') {
    userWorkspaces = userWorkspaces.filter(project => project.type === type);
  }
  
  // Apply language filter
  if (language && language !== 'all') {
    userWorkspaces = userWorkspaces.filter(project => project.language === language);
  }
  
  // Apply sorting
  userWorkspaces.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt);
  });
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProjects = userWorkspaces.slice(startIndex, endIndex);
  
  res.json({
    projects: paginatedProjects,
    total: userWorkspaces.length,
    totalPages: Math.ceil(userWorkspaces.length / limit),
    currentPage: parseInt(page)
  });
});

app.get('/api/projects/stats', authenticateUser, (req, res) => {
  const userWorkspaces = workspaces.filter(w => w.userId === req.userId);
  const userHistory = history.filter(h => h.userId === req.userId);
  
  res.json({
    totalProjects: userWorkspaces.length,
    totalAnalyses: userHistory.length,
    totalProblems: 0,
    weeklyActivity: userHistory.filter(h => 
      new Date(h.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  });
});

app.post('/api/projects', authenticateUser, (req, res) => {
  const { title, description, language = 'javascript', tags = [] } = req.body;
  
  const workspace = {
    id: Date.now(),
    userId: req.userId,
    title,
    description,
    type: 'sandbox',
    language,
    tags,
    content: getStarterCode(language),
    createdAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString()
  };
  
  workspaces.push(workspace);
  saveWorkspaces();
  res.status(201).json(workspace);
});

app.get('/api/projects/:id', (req, res) => {
  const workspace = workspaces.find(w => w.id == req.params.id);
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  
  workspace.lastOpenedAt = new Date().toISOString();
  saveWorkspaces();
  
  res.json({
    ...workspace,
    Files: [{
      id: 1,
      name: getDefaultFileName(workspace.language),
      content: workspace.content,
      language: workspace.language,
      isMain: true
    }]
  });
});

app.put('/api/projects/:id', (req, res) => {
  const { title, description, tags, content, lastOpenedAt } = req.body;
  const workspaceIndex = workspaces.findIndex(w => w.id == req.params.id);
  
  if (workspaceIndex === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  
  if (title) workspaces[workspaceIndex].title = title;
  if (description) workspaces[workspaceIndex].description = description;
  if (tags) workspaces[workspaceIndex].tags = tags;
  if (content) workspaces[workspaceIndex].content = content;
  if (lastOpenedAt) workspaces[workspaceIndex].lastOpenedAt = lastOpenedAt;
  
  saveWorkspaces();
  res.json(workspaces[workspaceIndex]);
});

app.delete('/api/projects/:id', (req, res) => {
  const workspaceIndex = workspaces.findIndex(w => w.id == req.params.id);
  if (workspaceIndex === -1) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  
  workspaces.splice(workspaceIndex, 1);
  saveWorkspaces();
  res.json({ message: 'Workspace deleted successfully' });
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
app.get('/', (req, res) => {
  res.json({
    message: 'AI Code Review API is running',
    status: 'OK',
    registeredUsers: users.length,
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login'],
      ai: ['/api/ai/review', '/api/ai/debug', '/api/ai/optimize', '/api/ai/chat']
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to verify server is running`);
});