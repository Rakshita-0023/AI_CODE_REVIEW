import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import sequelize from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import historyRoutes from './src/routes/history.js';
import executeRoutes from './src/routes/execute.js';
import notesRoutes from './src/routes/notes.js';
import User from './src/models/User.js';
import Analysis from './src/models/Analysis.js';
import Note from './src/models/Note.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Helper function to save analysis to history
const saveToHistory = async (req, type, language, code, result, qualityScore = null) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Analysis.create({
        userId: decoded.userId,
        type,
        language,
        originalCode: code,
        result,
        qualityScore,
        processingTime: 100,
      });
      console.log(`✅ Saved ${type} analysis to history for user ${decoded.userId}`);
    } catch (error) {
      console.log(`❌ Failed to save to history: ${error.message}`);
    }
  }
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://your-domain.com'])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5178', 'http://127.0.0.1:5173', 'http://127.0.0.1:5178'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Real AI service with Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const aiService = {
  async analyzeCode(code, language, type) {
    console.log(`\n=== AI ANALYSIS START ===`);
    console.log(`Type: ${type}`);
    console.log(`Language: ${language}`);
    console.log(`Code: ${code}`);
    console.log(`API Key exists: ${!!process.env.GEMINI_API_KEY}`);
    
    const prompt = this.buildPrompt(code, language, type);
    console.log(`Prompt: ${prompt}`);
    
    try {
      console.log('Calling Gemini AI...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw AI Response:', text);
      
      // Try to extract and parse JSON
      let jsonStr = text.trim();
      
      // Remove markdown code blocks
      jsonStr = jsonStr.replace(/```json\s*|```\s*/g, '');
      
      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      console.log('Extracted JSON string:', jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      console.log('✅ Successfully parsed AI response:', parsed);
      console.log('=== AI ANALYSIS SUCCESS ===\n');
      
      // Add a flag to indicate this is a real AI response
      parsed._isAIResponse = true;
      return parsed;
      
    } catch (error) {
      console.error('❌ AI Service Error:', error.message);
      console.log('🔄 Using fallback response');
      console.log('=== AI ANALYSIS FALLBACK ===\n');
      
      const fallback = this.getFallbackResponse(type, code);
      fallback._isFallback = true;
      return fallback;
    }
  },

  buildPrompt(code, language, type) {
    const basePrompt = `You are a code analysis expert. Analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    switch (type) {
      case 'review':
        return basePrompt + `You are a strict code reviewer. Analyze this code thoroughly and find ALL issues:

1. SYNTAX ERRORS: Missing semicolons, brackets, quotes, etc.
2. LOGIC ERRORS: Infinite loops, wrong conditions, unreachable code
3. RUNTIME ERRORS: Undefined variables, null references, type errors
4. BEST PRACTICES: Poor naming, missing error handling, code smells
5. SECURITY ISSUES: Injection vulnerabilities, unsafe operations

Be critical! Even simple code can have issues. Rate harshly if problems exist.

If code has ANY errors or issues, score should be 60 or below.
If code is perfect, score can be 80-95.

Return ONLY this JSON (no markdown, no extra text):
{
  "qualityScore": 45,
  "issues": [
    {"line": 1, "severity": "high", "message": "Specific issue found", "suggestion": "Specific fix needed"}
  ],
  "summary": "Detailed summary of all problems found"
}`;
      
      case 'debug':
        return basePrompt + `You are a debugging expert. This code has bugs - find them ALL and fix them!

Look for:
- SYNTAX ERRORS: Missing semicolons, brackets, quotes, incomplete statements
- LOGIC ERRORS: Wrong operators (= vs ==), infinite loops, wrong conditions
- RUNTIME ERRORS: Undefined variables, null references, type mismatches
- MISSING CODE: Incomplete functions, missing return statements

For the given code, identify EVERY bug and provide the corrected version.

Return ONLY this JSON format (no markdown, no extra text):
{
  "bugs": [
    {"line": 1, "issue": "Syntax error: incomplete variable declaration", "fix": "Complete the variable assignment: let x = 'hello';"},
    {"line": 2, "issue": "ReferenceError: x might be undefined", "fix": "Add null check before using x.length"},
    {"line": 3, "issue": "Logic error: assignment (=) instead of comparison (===)", "fix": "Change 'if (x = 5)' to 'if (x === 5)'"}
  ],
  "fixedCode": "let x = 'hello';\nif (x) {\n  console.log(x.length);\n}\nif (x === 5) {\n  console.log('correct');\n}",
  "explanation": "Fixed syntax error in variable declaration, added null check, and corrected assignment operator to comparison operator."
}`;
      
      case 'approaches':
        return basePrompt + `You MUST provide 3 different approaches to rewrite this code. Even for simple code, show alternatives:

1. **Functional Programming Approach** - Use map, filter, reduce, arrow functions
2. **Object-Oriented Approach** - Use classes, methods, encapsulation
3. **Modern/Optimized Approach** - Use latest language features, better patterns

For ANY code, you can always suggest:
- Different variable declarations (const vs let)
- Different function styles (arrow vs regular)
- Different error handling approaches
- Different data structures
- Different algorithms

Return ONLY this JSON format (no markdown, no extra text):
{
  "alternatives": [
    {
      "approach": "Functional Programming Style",
      "code": "const x = 'hello';\nconst logLength = (str) => str && console.log(str.length);\nlogLength(x);\nconst checkValue = (val) => val === 5 && console.log('correct');\ncheckValue(x);",
      "pros": ["Immutable", "Pure functions", "Predictable"],
      "cons": ["May be less familiar", "More verbose"]
    },
    {
      "approach": "Object-Oriented Style",
      "code": "class StringHandler {\n  constructor(value) { this.value = value; }\n  logLength() { this.value && console.log(this.value.length); }\n  checkValue(target) { this.value === target && console.log('correct'); }\n}\nconst handler = new StringHandler('hello');\nhandler.logLength();\nhandler.checkValue(5);",
      "pros": ["Encapsulation", "Reusable", "Organized"],
      "cons": ["More complex", "Overkill for simple tasks"]
    },
    {
      "approach": "Modern ES6+ Style",
      "code": "const x = 'hello';\nx?.length && console.log(x.length);\n(x === 5) ? console.log('correct') : console.log('not 5');",
      "pros": ["Concise", "Modern syntax", "Safe property access"],
      "cons": ["Requires modern browser", "Less explicit"]
    }
  ]
}`;
      
      case 'optimize':
        return basePrompt + `Optimize this code for:
- Better performance
- Memory efficiency
- Readability
- Best practices

Return ONLY this JSON format (no other text):
{
  "optimizations": [
    {
      "type": "Performance",
      "description": "Use more efficient algorithm",
      "optimizedCode": "optimized code here",
      "improvement": "50% faster execution"
    }
  ]
}`;
      
      default:
        return basePrompt + 'Provide general analysis.';
    }
  },

  getFallbackResponse(type, code) {
    // Basic code analysis for fallback
    const hasErrors = /undefined|null\.|\.undefined|console\.error|throw new Error/i.test(code);
    const hasConsoleLog = /console\.log/g.test(code);
    const codeLength = code.length;
    
    switch (type) {
      case 'review':
        const score = hasErrors ? 45 : (hasConsoleLog ? 70 : 85);
        const issues = [];
        if (hasErrors) issues.push({ line: 1, severity: 'high', message: 'Potential runtime errors detected', suggestion: 'Check for undefined variables or null references' });
        if (hasConsoleLog) issues.push({ line: 1, severity: 'low', message: 'Console.log statements found', suggestion: 'Remove debug statements in production' });
        if (codeLength < 10) issues.push({ line: 1, severity: 'medium', message: 'Very short code snippet', suggestion: 'Consider adding more context or functionality' });
        
        return {
          qualityScore: score,
          issues: issues.length > 0 ? issues : [{ line: 1, severity: 'low', message: 'Code looks good', suggestion: 'Consider adding comments for better readability' }],
          summary: hasErrors ? 'Code has potential issues that need attention' : 'Code appears to be well-structured'
        };
        
      case 'debug':
        const bugs = [];
        let fixedCode = code;
        
        // Check for incomplete statements
        if (code.includes('let x = \n') || code.includes('let x =\n')) {
          bugs.push({ line: 1, issue: 'Incomplete variable declaration', fix: 'Complete the assignment: let x = "hello";' });
          fixedCode = fixedCode.replace(/let x = \s*\n/, 'let x = "hello";\n');
        }
        
        // Check for assignment in conditions
        if (code.includes('if (') && code.includes(' = ') && !code.includes('==')) {
          bugs.push({ line: 3, issue: 'Assignment operator in condition', fix: 'Use === for comparison instead of =' });
          fixedCode = fixedCode.replace(/if \(([^=]+) = ([^)]+)\)/, 'if ($1 === $2)');
        }
        
        // Check for potential undefined access
        if (code.includes('.length') || code.includes('.')) {
          bugs.push({ line: 2, issue: 'Potential undefined property access', fix: 'Add null/undefined check before accessing properties' });
        }
        
        // Check for syntax errors
        if (code.includes('console.log') && !code.includes(';')) {
          bugs.push({ line: 2, issue: 'Missing semicolon', fix: 'Add semicolon after console.log statement' });
          fixedCode = fixedCode.replace(/console\.log\([^)]+\)(?!;)/g, '$&;');
        }
        
        return {
          bugs: bugs.length > 0 ? bugs : [{ line: 1, issue: 'Code structure could be improved', fix: 'Add error handling and proper variable initialization' }],
          fixedCode: bugs.length > 0 ? fixedCode : code,
          explanation: bugs.length > 0 ? `Found ${bugs.length} issues that need fixing` : 'Code appears functional but could be improved'
        };
        
      case 'approaches':
        return {
          alternatives: [
            { 
              approach: 'Functional Programming Style', 
              code: `// Functional approach\nconst safeLog = (str) => str && console.log(str.length);\nconst x = 'hello';\nsafeLog(x);`, 
              pros: ['Pure functions', 'Immutable', 'Predictable'], 
              cons: ['More verbose', 'Learning curve'] 
            },
            { 
              approach: 'Error-Safe Approach', 
              code: `// With proper error handling\ntry {\n  const x = 'hello';\n  if (x && typeof x === 'string') {\n    console.log(x.length);\n  }\n} catch (error) {\n  console.error('Error:', error);\n}`, 
              pros: ['Robust', 'Production-ready', 'Safe'], 
              cons: ['More code', 'Verbose'] 
            },
            { 
              approach: 'Modern ES6+ Style', 
              code: `// Using modern JavaScript\nconst x = 'hello';\nx?.length && console.log(x.length);\nconst result = x === 5 ? 'correct' : 'not 5';\nconsole.log(result);`, 
              pros: ['Concise', 'Modern', 'Optional chaining'], 
              cons: ['Browser compatibility', 'Less explicit'] 
            }
          ]
        };
        
      case 'optimize':
        return {
          optimizations: [
            { type: 'Performance', description: 'Consider caching results if this code runs frequently', optimizedCode: code, improvement: 'Potential performance gain' },
            { type: 'Readability', description: 'Add comments and meaningful variable names', optimizedCode: code, improvement: 'Better maintainability' }
          ]
        };
        
      default:
        return { message: 'Analysis completed' };
    }
  },

  detectLanguage(code) {
    console.log('Detecting language for code:', code);
    
    const patterns = {
      javascript: /(let|const|var|console\.log|function|=>|\$\(|document\.|window\.|alert\()/,
      python: /(import |from |def |class |print\(|if __name__|:\s*$)/m,
      java: /(public class|import java\.|System\.out|public static void main)/,
      cpp: /(#include|using namespace|int main\(|std::)/,
      csharp: /(using System|namespace|public class|Console\.WriteLine)/,
      php: /(<\?php|\$[a-zA-Z]|echo |print )/,
      ruby: /(require|class|def |puts |end$)/m,
      go: /(package |import |func main\(|fmt\.)/,
      rust: /(fn main\(|use |let mut|println!)/,
      sql: /(SELECT|INSERT|UPDATE|DELETE|CREATE|FROM|WHERE)/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(code)) {
        console.log(`Detected language: ${lang}`);
        return lang;
      }
    }
    
    console.log('Language detection failed, defaulting to javascript');
    return 'javascript';
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Code Reviewer API',
    endpoints: {
      health: 'GET /health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      review: 'POST /api/ai/review',
      debug: 'POST /api/ai/debug',
      approaches: 'POST /api/ai/approaches',
      optimize: 'POST /api/ai/optimize'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/notes', notesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI routes
app.post('/api/ai/review', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    console.log(`Language: input='${language}' -> detected='${detectedLanguage}'`);
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'review');
    
    const response = {
      reviewId: 'mock-id',
      sessionId: 'mock-session',
      language: detectedLanguage,
      qualityScore: analysis.qualityScore,
      issues: analysis.issues,
      summary: analysis.summary,
      processingTime: 100,
      _debug: {
        isAIResponse: !!analysis._isAIResponse,
        isFallback: !!analysis._isFallback,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save to history
    await saveToHistory(req, 'review', detectedLanguage, code, response, analysis.qualityScore);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Code review failed' });
  }
});

app.post('/api/ai/debug', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    console.log(`Language: input='${language}' -> detected='${detectedLanguage}'`);
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'debug');
    
    const response = {
      reviewId: 'mock-id',
      sessionId: 'mock-session',
      language: detectedLanguage,
      bugs: analysis.bugs,
      fixedCode: analysis.fixedCode,
      explanation: analysis.explanation,
      processingTime: 100,
      _debug: {
        isAIResponse: !!analysis._isAIResponse,
        isFallback: !!analysis._isFallback,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save to history
    await saveToHistory(req, 'debug', detectedLanguage, code, response);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Code debugging failed' });
  }
});

app.post('/api/ai/approaches', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    console.log(`Language: input='${language}' -> detected='${detectedLanguage}'`);
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'approaches');
    
    const response = {
      reviewId: 'mock-id',
      sessionId: 'mock-session',
      language: detectedLanguage,
      alternatives: analysis.alternatives,
      processingTime: 100,
      _debug: {
        isAIResponse: !!analysis._isAIResponse,
        isFallback: !!analysis._isFallback,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save to history
    await saveToHistory(req, 'approaches', detectedLanguage, code, response);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Alternative approaches analysis failed' });
  }
});

app.post('/api/ai/optimize', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    console.log(`Language: input='${language}' -> detected='${detectedLanguage}'`);
    const analysis = await aiService.analyzeCode(code, detectedLanguage, 'optimize');
    
    const response = {
      reviewId: 'mock-id',
      sessionId: 'mock-session',
      language: detectedLanguage,
      optimizations: analysis.optimizations,
      processingTime: 100,
      _debug: {
        isAIResponse: !!analysis._isAIResponse,
        isFallback: !!analysis._isFallback,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save to history
    await saveToHistory(req, 'optimize', detectedLanguage, code, response);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Code optimization failed' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    console.log('AI Chat request:', message);
    
    const prompt = `You are a helpful AI coding assistant. Respond to this user message in a conversational way: "${message}"`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Chat response:', text);
      res.json({ response: text });
    } catch (aiError) {
      console.error('AI Chat error:', aiError);
      // Fallback response
      const fallbackResponse = `I understand you're asking about: "${message}". I'm here to help with coding questions, debugging, code reviews, and programming concepts. Could you provide more specific details about what you'd like help with?`;
      res.json({ response: fallbackResponse });
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();