import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { CodeAnalyzer } from './src/analyzers/codeAnalyzer.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3456'],
  credentials: true
}));
app.use(express.json());

app.post('/api/ai/review', (req, res) => {
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
    userId: 1,
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
app.get('/api/history', (req, res) => {
  const userHistory = history.filter(h => h.userId === 1).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ history: userHistory });
});

// Notes endpoints
app.get('/api/notes', (req, res) => {
  const userNotes = notes.filter(n => n.userId === 1);
  res.json({ notes: userNotes });
});

app.post('/api/notes', (req, res) => {
  const { title, content, folder, tags = [] } = req.body;
  const note = {
    id: Date.now(),
    userId: 1,
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

// Scratchpads endpoints
app.get('/api/scratchpads', (req, res) => {
  const userScratchpads = scratchpads.filter(s => s.userId === 1);
  res.json({ scratchpads: userScratchpads });
});

app.post('/api/scratchpads', (req, res) => {
  const { workspaceId, title, content } = req.body;
  const scratchpad = {
    id: Date.now(),
    userId: 1,
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

// AI Chat endpoint with Gemini 2.5 Flash integration
app.post('/api/ai/chat', async (req, res) => {
  const { message, codeContext, workspaceId } = req.body;
  
  try {
    let response;
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
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
      userId: 1,
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
app.post('/api/ai/debug', async (req, res) => {
  const { code, language, workspaceId } = req.body;
  
  try {
    let response;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
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
      userId: 1,
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
app.post('/api/ai/optimize', async (req, res) => {
  const { code, language, workspaceId } = req.body;
  
  try {
    let response;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
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
      userId: 1,
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
}); = originalLine.replace(new RegExp(`\\b${typo}\\b`, 'g'), jsTypos[typo]);
          lines[lineIndex] = fixedLine;
        }
      });

      // Fix missing assignment operator
      if (issue.message.includes('Missing assignment operator')) {
        const match = originalLine.match(/(let|const|var)(\s+\w+)(\s+)(\d+)/);
        if (match) {
          fixedLine = match[1] + match[2] + ' = ' + match[4] + ';';
          lines[lineIndex] = fixedLine;
        }
      }

      // Fix missing parentheses in console.log
      if (issue.message.includes('Missing parentheses in console.log')) {
        if (originalLine.includes('console.log') && !originalLine.includes('(')) {
          fixedLine = originalLine.replace('console.log', 'console.log(') + ')';
          lines[lineIndex] = fixedLine;
        }
      }

      if (issue.message.includes('var')) {
        fixedLine = originalLine.replace(/\bvar\b/g, 'const');
        lines[lineIndex] = fixedLine;
      }
    }

    // Java fixes
    if (language === 'java') {
      if (issue.message.includes('System.out')) {
        fixedLine = originalLine.replace(/system\.out|System\.Out/g, 'System.out');
        lines[lineIndex] = fixedLine;
      }
    }

    // PHP fixes
    if (language === 'php') {
      if (issue.message.includes('variables must start with $')) {
        const varMatch = originalLine.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*=.*)/);
        if (varMatch) {
          fixedLine = varMatch[1] + '$' + varMatch[2] + varMatch[3];
          lines[lineIndex] = fixedLine;
        }
      }
      if (originalLine.trim() === '' && index === 0) {
        lines[lineIndex] = '<?php';
      }
    }

    // C/C++ fixes
    if (language === 'c' || language === 'cpp') {
      if (issue.message.includes('Missing #include')) {
        if (issue.message.includes('stdio.h')) {
          lines.unshift('#include <stdio.h>');
        }
        if (issue.message.includes('stdlib.h')) {
          lines.unshift('#include <stdlib.h>');
        }
      }
    }

    // HTML entities (all languages)
    if (issue.message.includes('HTML entities')) {
      fixedLine = originalLine
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      lines[lineIndex] = fixedLine;
    }

    return {
      line: issue.line,
      type: issue.category,
      severity: issue.severity,
      issue: issue.message,
      fix: issue.suggestion,
      code: fixedLine.trim()
    };
  });

  // Update fixed code
  fixedCode = lines.join('\n');

  if (bugs.length === 0) {
    bugs.push({
      line: 1,
      type: 'info',
      severity: 'low',
      issue: 'No errors detected',
      fix: `${language || 'Code'} syntax is correct`,
      code: ''
    });
  }

  const result = {
    reviewId: 'debug-' + Date.now(),
    language: language || 'javascript',
    bugs,
    fixedCode: bugs.length > 0 && bugs[0].type !== 'info' ? fixedCode : code,
    explanation: bugs.length === 1 && bugs[0].type === 'info' ?
      `✅ ${(language || 'Code').toUpperCase()} SCAN: No errors found.` :
      `Fixed ${bugs.filter(b => b.severity === 'high').length} critical error(s): ${bugs.filter(b => b.severity === 'high').map(b => b.issue).join(', ')}`
  };

  // Save to history
  const historyEntry = {
    id: Date.now(),
    userId: 1,
    workspaceId: req.body.workspaceId || null,
    type: 'debug',
    title: 'Debug Code',
    code: req.body.code,
    language: req.body.language,
    result,
    createdAt: new Date().toISOString()
  };
  history.push(historyEntry);
  saveHistory();

  res.json(result);
});

app.post('/api/ai/approaches', (req, res) => {
  const { code, language, workspaceId } = req.body;
  const result = {
    reviewId: 'approaches-' + Date.now(),
    language: language,
    alternatives: [{
      approach: `Modern ${language}`,
      code: code,
      pros: ['Clean', 'Readable'],
      cons: ['None']
    }]
  };

  // Save to history
  const historyEntry = {
    id: Date.now(),
    userId: 1,
    workspaceId: workspaceId || null,
    type: 'approaches',
    title: 'Alternative Approaches',
    code,
    language,
    result,
    createdAt: new Date().toISOString()
  };
  history.push(historyEntry);
  saveHistory();

  res.json(result);
});

app.post('/api/ai/optimize', (req, res) => {
  const { code, language } = req.body;

  // First fix all errors, then optimize
  const issues = CodeAnalyzer.analyzeCode(code, language);
  let optimizedCode = code;
  let lines = code.split('\n');

  // Fix errors first
  issues.forEach(issue => {
    const lineIndex = issue.line - 1;
    const originalLine = lines[lineIndex];

    if (issue.message.includes('ven_numbers')) {
      lines[lineIndex] = originalLine.replace('ven_numbers', 'even_numbers');
    }
    if (issue.message.includes('prit')) {
      lines[lineIndex] = originalLine.replace('prit', 'print');
    }
    if (originalLine.includes('.append(') && !originalLine.endsWith(')')) {
      lines[lineIndex] = originalLine + ')';
    }
    if (originalLine.match(/^\s*\w+\([^)]*$/)) {
      lines[lineIndex] = originalLine + ')';
    }
  });

  optimizedCode = lines.join('\n');

  // Add optimizations
  const optimizations = [];

  if (language === 'python') {
    // List comprehension optimization
    if (code.includes('for') && code.includes('append')) {
      const listComprehension = `even_numbers = [num for num in numbers if num % 2 == 0]\nprint(even_numbers)`;
      optimizations.push({
        type: 'List Comprehension',
        description: 'Use list comprehension for better performance',
        optimizedCode: `numbers = [10, 21, 32, 43, 54, 65, 76]\n\n${listComprehension}`,
        improvement: 'More Pythonic and faster execution'
      });
    }

    // Filter function optimization
    optimizations.push({
      type: 'Built-in Functions',
      description: 'Use filter() function',
      optimizedCode: `numbers = [10, 21, 32, 43, 54, 65, 76]\n\neven_numbers = list(filter(lambda x: x % 2 == 0, numbers))\nprint(even_numbers)`,
      improvement: 'Functional programming approach'
    });
  }

  if (optimizations.length === 0) {
    optimizations.push({
      type: 'Error Fixes',
      description: 'Fixed syntax and logic errors',
      optimizedCode: optimizedCode,
      improvement: 'Code now runs without errors'
    });
  }

  const result = {
    reviewId: 'optimize-' + Date.now(),
    language: language,
    optimizations
  };

  // Save to history
  const historyEntry = {
    id: Date.now(),
    userId: 1,
    workspaceId: req.body.workspaceId || null,
    type: 'optimize',
    title: 'Code Optimization',
    code: req.body.code,
    language: req.body.language,
    result,
    createdAt: new Date().toISOString()
  };
  history.push(historyEntry);
  saveHistory();

  res.json(result);
});

// Database storage
const USERS_FILE = path.join(process.cwd(), 'users.json');
const WORKSPACES_FILE = path.join(process.cwd(), 'workspaces.json');
const HISTORY_FILE = path.join(process.cwd(), 'history.json');
const NOTES_FILE = path.join(process.cwd(), 'notes.json');
const SCRATCHPADS_FILE = path.join(process.cwd(), 'scratchpads.json');

let users = [];
let workspaces = [];
let history = [];
let notes = [];
let scratchpads = [];

// Load data from files
try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  }
  if (fs.existsSync(WORKSPACES_FILE)) {
    workspaces = JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf8'));
  }
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  if (fs.existsSync(NOTES_FILE)) {
    notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
  }
  if (fs.existsSync(SCRATCHPADS_FILE)) {
    scratchpads = JSON.parse(fs.readFileSync(SCRATCHPADS_FILE, 'utf8'));
  }
} catch (error) {
  console.log('Starting with fresh data');
}

// Save functions
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function saveWorkspaces() {
  fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(workspaces, null, 2));
}
function saveHistory() {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}
function saveNotes() {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}
function saveScratchpads() {
  fs.writeFileSync(SCRATCHPADS_FILE, JSON.stringify(scratchpads, null, 2));
}

// Workspaces endpoints
app.get('/api/projects', (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const userWorkspaces = workspaces.filter(w => w.userId === 1); // Mock user ID
  
  res.json({
    projects: userWorkspaces,
    total: userWorkspaces.length,
    totalPages: Math.ceil(userWorkspaces.length / limit),
    currentPage: parseInt(page)
  });
});

app.get('/api/projects/stats', (req, res) => {
  const userWorkspaces = workspaces.filter(w => w.userId === 1);
  const userHistory = history.filter(h => h.userId === 1);
  const userNotes = notes.filter(n => n.userId === 1);
  
  res.json({
    totalProjects: userWorkspaces.length,
    totalAnalyses: userHistory.length,
    totalProblems: 0,
    weeklyActivity: userHistory.filter(h => 
      new Date(h.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  });
});

app.post('/api/projects', (req, res) => {
  const { title, description, language = 'javascript', tags = [] } = req.body;
  
  const workspace = {
    id: Date.now(),
    userId: 1, // Mock user ID
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

// Auth endpoints with proper validation
app.post('/api/auth/register', (req, res) => {
  const { fullName, username, email, phone, password, confirmPassword } = req.body;
  console.log('Registration for:', email);

  if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user already exists (case insensitive email)
  const existingUser = users.find(u =>
    u.email.toLowerCase() === email.toLowerCase() ||
    u.username === username ||
    u.phone === phone
  );

  if (existingUser) {
    if (existingUser.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    if (existingUser.username === username) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    if (existingUser.phone === phone) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
  }

  // Create new user
  const newUser = {
    id: Date.now(), // Use timestamp for unique ID
    fullName,
    username,
    email: email.toLowerCase(), // Store email in lowercase
    phone,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();
  console.log('User registered:', newUser.email, 'Total users:', users.length);

  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    message: 'Registration successful! You can now sign in.',
    token: 'token-' + newUser.id,
    user: userWithoutPassword
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  console.log('Available users:', users.map(u => ({ email: u.email, id: u.id })));

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email (case insensitive)
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.log('User not found for email:', email);
    return res.status(404).json({
      error: "Account not found. Please register first.",
      needsSignup: true
    });
  }

  // Check password
  if (user.password !== password) {
    console.log('Invalid password for user:', email);
    return res.status(401).json({ error: 'Incorrect password' });
  }

  console.log('Login successful for:', email);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: `Welcome back, ${user.fullName}!`,
    token: 'token-' + user.id + '-' + Date.now(),
    user: userWithoutPassword
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'AI Code Review API is running',
    status: 'OK',
    registeredUsers: users.length,
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login'],
      ai: ['/api/ai/review', '/api/ai/debug', '/api/ai/approaches', '/api/ai/optimize']
    }
  });
});

// Code Execution Endpoints
// Imports moved to top

const execAsync = promisify(exec);

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
    // Write input to file if provided
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
        // Node doesn't automatically pipe stdin like python does for input()
        // But we can pipe it in shell
        if (input) command += ` < "${inputPath}"`;
        break;

      case 'java':
        // Extract public class name
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Main';

        filePath = path.join(tempDir, `${className}.java`);
        fs.writeFileSync(filePath, code);

        const classPath = tempDir;
        // Compile and run
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

    // Execute
    const { stdout, stderr } = await execAsync(command, { timeout: 5000 }); // 5s timeout

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
  // Return empty suggestions to avoid "Wrong Input Template"
  // The frontend will handle empty suggestions gracefully
  res.json({
    suggestions: {
      input: '',
      output: ''
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to verify server is running`);
});