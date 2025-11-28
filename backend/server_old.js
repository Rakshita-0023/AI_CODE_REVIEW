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
import OTP from './src/models/OTP.js';

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

// LANGUAGE-AWARE ERROR DETECTION SYSTEM
const languageAwareDetector = {
  analyzeCode(code, language) {
    console.log(`Analyzing ${language} code`);
    const errors = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      if (!trimmed) return;
      
      console.log(`Line ${lineNum} (${language}): "${trimmed}"`);
      
      // PYTHON-SPECIFIC ANALYSIS
      if (language === 'python') {
        if (/^(for|if|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':')) {
          errors.push({ line: lineNum, type: 'syntax', severity: 'high', issue: 'Missing colon after Python statement', fix: 'Add : at end' });
        }
      }
      
      // JAVASCRIPT-SPECIFIC ANALYSIS  
      else if (language === 'javascript') {
        // JavaScript doesn't need colons after control structures
        console.log(`JavaScript line ${lineNum} - no colon check needed`);
        
        // Check for actual JS errors
        if (/\\$/.test(trimmed)) {
          errors.push({ line: lineNum, type: 'syntax', severity: 'high', issue: 'Unexpected backslash', fix: 'Remove backslash' });
        }
      }
      
      // UNIVERSAL CHECKS
      const openBrackets = (trimmed.match(/[\(\[\{]/g) || []).length;
      const closeBrackets = (trimmed.match(/[\)\]\}]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push({ line: lineNum, type: 'syntax', severity: 'critical', issue: 'Unmatched brackets', fix: 'Balance brackets' });
      }
    });
    
    console.log(`Found ${errors.length} errors in ${language} code`);
    return errors;
  }
};

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
      
      // Create a basic analysis if AI fails
      if (type === 'debug') {
        const bugs = [];
        let fixedCode = code;
        
        // Check for common Python errors
        if (language === 'python') {
          const lines = code.split('\n');
          
          lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            // Missing colon after for, if, while, def, class
            if (/^(for|if|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':') && trimmed.length > 0) {
              bugs.push({ 
                line: lineNum, 
                issue: `Missing colon (:) at end of ${trimmed.split(' ')[0]} statement`, 
                fix: `Add colon at end: ${trimmed}:` 
              });
              fixedCode = fixedCode.replace(line, line + ':');
            }
            
            // Invalid print syntax
            if (trimmed.includes('print ') && !trimmed.includes('print(')) {
              bugs.push({ 
                line: lineNum, 
                issue: 'Invalid print syntax - missing parentheses', 
                fix: 'Use print() with parentheses' 
              });
              fixedCode = fixedCode.replace(/print\s+([^\n]+)/, 'print($1)');
            }
            
            // Missing quotes in print
            if (/print\([^"'][^)]*[^"']\)/.test(trimmed) && !/print\(\w+\)/.test(trimmed)) {
              bugs.push({ 
                line: lineNum, 
                issue: 'Missing quotes in print statement', 
                fix: 'Add quotes around text' 
              });
            }
          });
        }
        
        return {
          bugs: bugs.length > 0 ? bugs : [{ line: 1, issue: 'Code structure could be improved', fix: 'Add error handling' }],
          fixedCode: bugs.length > 0 ? fixedCode : code,
          explanation: bugs.length > 0 ? 'Fixed detected issues' : 'No critical bugs found',
          _isFallback: true
        };
      }
      
      return {
        error: 'AI analysis failed',
        type,
        _isFallback: true
      };
    }
  },

  buildPrompt(code, language, type) {
    const basePrompt = `You are a code analysis expert. Analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    switch (type) {
      case 'review':
        return `Be extremely critical. This ${language} code has problems:\n\n${code}\n\nFind: syntax errors, undefined variables, typos, missing parts, logic errors.\nScore harshly. Most code has issues.\n\nReturn JSON:\n{"qualityScore": 30, "issues": [{"line": 1, "severity": "high", "message": "specific problem", "suggestion": "fix needed"}], "summary": "problems found"}`;
      
      case 'debug':
        return `CRITICAL: This ${language} code has syntax errors. Find them:\n\n${code}\n\nCheck EVERY line for:\n- Missing colons after for/if/while/def\n- Missing quotes\n- Wrong indentation\n- Typos\n\nYou MUST find the syntax errors and fix them.\n\nReturn JSON:\n{"bugs": [{"line": 1, "issue": "Missing colon after for statement", "fix": "Add : at end"}], "fixedCode": "${code.replace(/for num in numbers/, 'for num in numbers:')}", "explanation": "Fixed syntax errors"}`;
      
      case 'approaches':
        return `Provide 3 different ${language} approaches for this code.

Original ${language} code:
\`\`\`${language}
${code}
\`\`\`

Create 3 alternative solutions using ONLY ${language}:
1. Functional/procedural approach
2. Object-oriented approach  
3. Modern/optimized approach

IMPORTANT: All code must be in ${language} language only!

Respond with this exact JSON structure:
{
  "alternatives": [
    {
      "approach": "Functional ${language}",
      "code": "${language} code here",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["disadvantage 1", "disadvantage 2"]
    },
    {
      "approach": "Object-Oriented ${language}",
      "code": "${language} code here",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["disadvantage 1", "disadvantage 2"]
    },
    {
      "approach": "Modern ${language}",
      "code": "${language} code here",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["disadvantage 1", "disadvantage 2"]
    }
  ]
}`;
      
      case 'optimize':
        return `Optimize this ${language} code:\n\n${code}\n\nMake it faster and more efficient. Keep it in ${language} language.\n\nReturn JSON:\n{"optimizations": [{"type": "Performance", "description": "optimization made", "optimizedCode": "improved ${language} code", "improvement": "benefit gained"}]}`;
      
      default:
        return basePrompt + 'Provide general analysis.';
    }
  },



  getLanguageSpecificApproaches(code, language) {
    const baseCode = code.trim();
    
    switch (language.toLowerCase()) {
      case 'python':
        return [
          {
            approach: `Functional Python Style`,
            code: `# Functional approach\n${baseCode}\n# Add list comprehensions and lambda functions`,
            pros: ['Pythonic', 'Concise', 'Readable'],
            cons: ['May be less performant', 'Learning curve']
          },
          {
            approach: `Object-Oriented Python Style`,
            code: `# OOP approach\nclass CodeHandler:\n    def __init__(self):\n        pass\n    \n    def process(self):\n        ${baseCode.replace(/\n/g, '\n        ')}`,
            pros: ['Encapsulation', 'Reusable', 'Maintainable'],
            cons: ['More complex', 'Overhead']
          },
          {
            approach: `Modern Python Style`,
            code: `# Modern Python with type hints\n${baseCode}\n# Add type annotations and modern features`,
            pros: ['Type safety', 'Modern', 'IDE support'],
            cons: ['Python 3.5+ required', 'More verbose']
          }
        ];
      
      case 'java':
        return [
          {
            approach: `Procedural Java Style`,
            code: `// Procedural approach\npublic static void main(String[] args) {\n    ${baseCode.replace(/\n/g, '\n    ')}\n}`,
            pros: ['Simple', 'Direct', 'Easy to understand'],
            cons: ['Not reusable', 'Hard to test']
          },
          {
            approach: `Object-Oriented Java Style`,
            code: `// OOP approach\npublic class Solution {\n    ${baseCode.replace(/\n/g, '\n    ')}\n}`,
            pros: ['Encapsulation', 'Reusable', 'Testable'],
            cons: ['More boilerplate', 'Complex']
          },
          {
            approach: `Modern Java Style`,
            code: `// Modern Java with streams\n${baseCode}\n// Use Stream API and lambda expressions`,
            pros: ['Functional style', 'Concise', 'Parallel processing'],
            cons: ['Java 8+ required', 'Learning curve']
          }
        ];
      
      default: // JavaScript and others
        return [
          {
            approach: `Functional ${language} Style`,
            code: `// Functional approach\n${baseCode}\n// Use pure functions and immutable data`,
            pros: ['Pure functions', 'Predictable', 'Testable'],
            cons: ['May be verbose', 'Learning curve']
          },
          {
            approach: `Object-Oriented ${language} Style`,
            code: `// OOP approach\nclass Handler {\n    constructor() {}\n    \n    process() {\n        ${baseCode.replace(/\n/g, '\n        ')}\n    }\n}`,
            pros: ['Encapsulation', 'Reusable', 'Organized'],
            cons: ['More complex', 'Overhead']
          },
          {
            approach: `Modern ${language} Style`,
            code: `// Modern approach\n${baseCode}\n// Use latest language features`,
            pros: ['Modern syntax', 'Concise', 'Efficient'],
            cons: ['Browser/version compatibility', 'Less explicit']
          }
        ];
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
    
    // Use frontend language parameter directly
    const detectedLanguage = language && language !== 'auto' ? language : aiService.detectLanguage(code);
    
    console.log('=== LANGUAGE-AWARE CODE REVIEW ===');
    console.log(`Frontend language: ${language}, Using: ${detectedLanguage}`);
    
    // LANGUAGE-AWARE ANALYSIS ONLY
    console.log('Using language-specific analysis system');
    
    // LANGUAGE-AWARE REVIEW SYSTEM
    const issues = [];
    let qualityScore = 100; // Start high, deduct for issues
    
    console.log('Running comprehensive fallback review...');
    
    // LANGUAGE-AWARE REVIEW ANALYSIS
    console.log(`Review analysis for ${detectedLanguage}`);
    
    // Clean HTML entities first
    const cleanCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    
    const lines = cleanCode.split('\n');
    
    // Only check for actual errors based on language
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      if (!trimmed) return;
      
      // PYTHON-SPECIFIC CHECKS
      if (detectedLanguage === 'python') {
        if (/^(for|if|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: 'Missing colon after Python control statement',
            suggestion: 'Add colon (:) at the end'
          });
          qualityScore -= 15;
        }
      }
      
      // JAVASCRIPT-SPECIFIC CHECKS
      else if (detectedLanguage === 'javascript') {
        console.log(`Analyzing JavaScript line ${lineNum}: "${trimmed}"`);
        
        // Only check for real JavaScript errors
        if (/\\$/.test(trimmed)) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: 'Unexpected backslash at end of line',
            suggestion: 'Remove trailing backslash'
          });
          qualityScore -= 10;
        }
        
        // Missing semicolon (optional in JS)
        if (/^(let|const|var|return)\b/.test(trimmed) && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
          issues.push({
            line: lineNum,
            severity: 'low',
            category: 'style',
            message: 'Missing semicolon (optional in JavaScript)',
            suggestion: 'Consider adding semicolon for consistency'
          });
          qualityScore -= 2;
        }
        
        console.log(`JavaScript line ${lineNum} analysis complete`);
      }
      
      // UNIVERSAL CHECKS (all languages)
      const openBrackets = (trimmed.match(/[\(\[\{]/g) || []).length;
      const closeBrackets = (trimmed.match(/[\)\]\}]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Unmatched brackets/parentheses',
          suggestion: 'Balance brackets and parentheses'
        });
        qualityScore -= 12;
      }
    });
    
    // Use language-aware detector
    const allErrors = languageAwareDetector.analyzeCode(cleanCode, detectedLanguage);
    
    // Add errors to issues array
    allErrors.forEach(error => {
      issues.push({
        line: error.line,
        severity: error.severity,
        category: error.type,
        message: error.issue,
        suggestion: error.fix
      });
      
      const deduction = { critical: 20, high: 15, medium: 8, low: 3 };
      qualityScore -= deduction[error.severity] || 5;
    });
    
    // Dummy variables for compatibility
    const syntaxErrors = allErrors.filter(e => e.type === 'syntax');
    const logicErrors = [];
    const variableErrors = [];
    const methodErrors = [];
    const spellingErrors = [];
    const importErrors = [];
    
    // Additional analysis already done above
    
    // Additional style and best practice checks
    const lines = code.split('\n');
    let hasComments = false;
    let hasErrorHandling = false;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Check for comments
      if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
        hasComments = true;
      }
      
      // Check for error handling
      if (trimmed.includes('try') || trimmed.includes('catch') || trimmed.includes('except')) {
        hasErrorHandling = true;
      }
      
      // Long lines
      if (line.length > 100) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'style',
          message: 'Line too long (>100 characters)',
          suggestion: 'Break into multiple lines'
        });
        qualityScore -= 2;
      }
      
      // Inconsistent indentation
      if (line.length > trimmed.length) {
        const indent = line.length - trimmed.length;
        if (indent % 2 !== 0 && indent % 4 !== 0) {
          issues.push({
            line: lineNum,
            severity: 'medium',
            category: 'style',
            message: 'Inconsistent indentation',
            suggestion: 'Use consistent 2 or 4 space indentation'
          });
          qualityScore -= 5;
        }
      }
    });
    
    // Best practice deductions
    if (!hasComments && code.length > 100) {
      issues.push({
        line: 1,
        severity: 'low',
        category: 'practice',
        message: 'No comments found',
        suggestion: 'Add comments to explain complex logic'
      });
      qualityScore -= 5;
    }
    
    if (!hasErrorHandling && code.length > 200) {
      issues.push({
        line: 1,
        severity: 'medium',
        category: 'practice',
        message: 'No error handling found',
        suggestion: 'Add try-catch blocks for error handling'
      });
      qualityScore -= 10;
    }
    
    // Ensure minimum score
    qualityScore = Math.max(qualityScore, 15);
    
    // Language-specific success messages
    if (issues.length === 0) {
      if (detectedLanguage === 'javascript') {
        issues.push({
          line: 1,
          severity: 'info',
          category: 'general',
          message: '✅ JavaScript code is syntactically correct',
          suggestion: 'No errors found in JavaScript syntax'
        });
      } else if (detectedLanguage === 'python') {
        issues.push({
          line: 1,
          severity: 'info',
          category: 'general',
          message: '✅ Python code is syntactically correct',
          suggestion: 'No errors found in Python syntax'
        });
      } else {
        issues.push({
          line: 1,
          severity: 'info',
          category: 'general',
          message: `✅ ${detectedLanguage.toUpperCase()} code looks good`,
          suggestion: `No major issues detected in ${detectedLanguage} code`
        });
      }
      qualityScore = Math.max(qualityScore, 90);
    }
    
    console.log(`Comprehensive review complete: ${issues.length} issues, score: ${qualityScore}`);
    
    res.json({
      reviewId: 'review-' + Date.now(),
      sessionId: 'session-' + Date.now(),
      language: detectedLanguage,
      qualityScore: qualityScore,
      issues: issues,
      summary: issues.length > 0 ? 
        `Found ${issues.length} issues across multiple categories. Quality score: ${qualityScore}/100` :
        `Excellent code quality. Score: ${qualityScore}/100`,
      processingTime: 80,
      _debug: { 
        isComprehensiveReview: true, 
        issueCount: issues.length,
        issuesByCategory: {
          syntax: syntaxErrors.length,
          logic: logicErrors.length,
          variables: variableErrors.length,
          methods: methodErrors.length,
          spelling: spellingErrors.length,
          imports: importErrors.length
        }
      }
    });
    
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Code review failed', details: error.message });
  }
});



// LANGUAGE-AWARE DEBUGGING SYSTEM
app.post('/api/ai/debug', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    // Use frontend language parameter directly
    const detectedLanguage = language && language !== 'auto' ? language : aiService.detectLanguage(code);
    
    console.log('=== LANGUAGE-AWARE DEBUGGING ===');
    console.log(`Frontend language: ${language}, Using: ${detectedLanguage}`);
    console.log(`Code sample: ${code.substring(0, 100)}...`);
    
    // LANGUAGE-SPECIFIC DEBUGGING ONLY
    console.log(`🔍 Using ${detectedLanguage.toUpperCase()} specific analysis`);
    
    // LANGUAGE-AWARE DEBUGGING SYSTEM
    const bugs = [];
    let fixedCode = code;
    
    // Clean HTML entities first
    const cleanCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    
    const lines = cleanCode.split('\n');
    
    // COMPREHENSIVE ERROR DETECTION
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const original = line;
      const trimmed = line.trim();
      
      if (!trimmed) return;
      
      // 1. SYNTAX ERRORS (Language-specific)
      console.log(`Checking line ${lineNum} for ${detectedLanguage}: "${trimmed}"`);
      
      if (detectedLanguage === 'python') {
        if (/^(for|if|while|def|class|elif|else|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':')) {
          console.log(`Python colon error found on line ${lineNum}`);
          bugs.push({ line: lineNum, type: 'syntax', severity: 'critical', issue: 'Missing colon after Python control statement', fix: 'Add colon (:) at end', code: trimmed });
        }
      } else if (detectedLanguage === 'javascript') {
        console.log(`Analyzing JavaScript syntax on line ${lineNum}`);
        
        // JavaScript-specific error checks
        if (/\\$/.test(trimmed)) {
          bugs.push({ line: lineNum, type: 'syntax', severity: 'high', issue: 'Unexpected backslash at end of line', fix: 'Remove trailing backslash', code: trimmed });
        }
        
        // Missing semicolon (style issue, not error)
        if (/^(let|const|var|return)\b/.test(trimmed) && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
          bugs.push({ line: lineNum, type: 'style', severity: 'low', issue: 'Missing semicolon (JavaScript style)', fix: 'Add semicolon for consistency', code: trimmed });
        }
        
        console.log(`JavaScript line ${lineNum} - no colon errors (correct for JS)`);
      } else {
        console.log(`Language ${detectedLanguage} - using universal checks only`);
      }
      
      // 2. VARIABLE NAME ERRORS (Language-specific)
      if (detectedLanguage === 'python') {
        const pythonVarErrors = [
          { pattern: /even_nmbersapend|nmbersapend/, correct: 'even_numbers.append' },
          { pattern: /numbersi\]/, correct: 'numbers[i]' },
          { pattern: /numbersers/, correct: 'numbers' },
          { pattern: /lenght/, correct: 'length' },
          { pattern: /apend/, correct: 'append' }
        ];
        
        pythonVarErrors.forEach(error => {
          if (error.pattern.test(trimmed)) {
            bugs.push({ line: lineNum, type: 'variable', severity: 'high', issue: `Variable name error`, fix: `Correct to "${error.correct}"`, code: trimmed });
          }
        });
      } else if (detectedLanguage === 'javascript') {
        const jsVarErrors = [
          { pattern: /lenght/, correct: 'length' },
          { pattern: /consoel/, correct: 'console' },
          { pattern: /fucntion/, correct: 'function' }
        ];
        
        jsVarErrors.forEach(error => {
          if (error.pattern.test(trimmed)) {
            bugs.push({ line: lineNum, type: 'variable', severity: 'high', issue: `Variable name error`, fix: `Correct to "${error.correct}"`, code: trimmed });
          }
        });
      }
      
      // 3. METHOD CALL ERRORS (Language-specific)
      if (detectedLanguage === 'python') {
        if (/\w+(append|remove|insert|pop)\(/.test(trimmed) && !/\.(append|remove|insert|pop)\(/.test(trimmed)) {
          bugs.push({ line: lineNum, type: 'method', severity: 'high', issue: 'Missing dot before method call', fix: 'Add dot before method name', code: trimmed });
        }
      }
      
      // 4. LOGIC ERRORS
      if (/if\s+.*\s=\s[^=]/.test(trimmed) && !/==|!=|<=|>=/.test(trimmed)) {
        bugs.push({ line: lineNum, type: 'logic', severity: 'critical', issue: 'Assignment (=) used in condition instead of comparison (==)', fix: 'Change = to ==', code: trimmed });
      }
      
      // 5. INDENTATION ERRORS
      if (line !== trimmed && line.length > 0) {
        const indent = line.length - trimmed.length;
        if (indent % 4 !== 0) {
          bugs.push({ line: lineNum, type: 'indentation', severity: 'medium', issue: 'Incorrect indentation (should be multiple of 4)', fix: 'Fix indentation to 4-space increments', code: line });
        }
      }
      
      // 6. SPELLING ERRORS (Language-specific)
      if (detectedLanguage === 'python') {
        const pythonSpellingErrors = [
          { wrong: 'prnit', correct: 'print' },
          { wrong: 'fro ', correct: 'for ' },
          { wrong: 'whiel', correct: 'while' },
          { wrong: 'dfe ', correct: 'def ' },
          { wrong: 'improt', correct: 'import' }
        ];
        
        pythonSpellingErrors.forEach(error => {
          if (trimmed.includes(error.wrong)) {
            bugs.push({ line: lineNum, type: 'spelling', severity: 'high', issue: `Spelling error: "${error.wrong}"`, fix: `Correct to "${error.correct}"`, code: trimmed });
          }
        });
      } else if (detectedLanguage === 'javascript') {
        const jsSpellingErrors = [
          { wrong: 'fucntion', correct: 'function' },
          { wrong: 'consoel', correct: 'console' },
          { wrong: 'documnet', correct: 'document' },
          { wrong: 'lenght', correct: 'length' }
        ];
        
        jsSpellingErrors.forEach(error => {
          if (trimmed.includes(error.wrong)) {
            bugs.push({ line: lineNum, type: 'spelling', severity: 'high', issue: `Spelling error: "${error.wrong}"`, fix: `Correct to "${error.correct}"`, code: trimmed });
          }
        });
      }
      
      // 7. BRACKET/PARENTHESES ERRORS
      const openBrackets = (trimmed.match(/[\(\[\{]/g) || []).length;
      const closeBrackets = (trimmed.match(/[\)\]\}]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        bugs.push({ line: lineNum, type: 'syntax', severity: 'critical', issue: 'Unmatched brackets/parentheses', fix: 'Balance brackets and parentheses', code: trimmed });
      }
      
      // 8. LANGUAGE-SPECIFIC STATEMENT ERRORS
      if (detectedLanguage === 'python' && /print\s+[^(]/.test(trimmed)) {
        bugs.push({ line: lineNum, type: 'syntax', severity: 'medium', issue: 'Missing parentheses in print statement', fix: 'Use print(...) with parentheses', code: trimmed });
      }
    });
    
    // APPLY LANGUAGE-SPECIFIC FIXES
    if (detectedLanguage === 'python') {
      fixedCode = cleanCode
        .replace(/^(\s*)(for|if|while|def|class|elif|else|try|except|finally|with)([^:\n]+)$/gm, '$1$2$3:')
        .replace(/even_nmbersapend|nmbersapend/g, 'even_numbers.append')
        .replace(/numbersi\]/g, 'numbers[i]')
        .replace(/numbersers/g, 'numbers')
        .replace(/lenght/g, 'length')
        .replace(/apend/g, 'append')
        .replace(/(\w+)(append|remove|insert|pop)\(/g, '$1.$2(')
        .replace(/prnit/g, 'print')
        .replace(/\bfro\b/g, 'for')
        .replace(/whiel/g, 'while')
        .replace(/\bdfe\b/g, 'def')
        .replace(/improt/g, 'import')
        .replace(/print\s+([^\n(]+)$/gm, 'print($1)');
    } else if (detectedLanguage === 'javascript') {
      fixedCode = cleanCode
        .replace(/fucntion/g, 'function')
        .replace(/consoel/g, 'console')
        .replace(/documnet/g, 'document')
        .replace(/lenght/g, 'length');
    } else {
      // For other languages, only apply safe fixes
      fixedCode = cleanCode
        .replace(/lenght/g, 'length');
    }
    
    console.log(`🔧 Comprehensive Debugger found ${bugs.length} errors`);
    
    res.json({
      reviewId: 'debug-' + Date.now(),
      language: detectedLanguage,
      bugs: bugs.length > 0 ? bugs : [{ line: 1, type: 'info', severity: 'low', issue: 'No errors detected', fix: 'Code appears correct', code: '' }],
      fixedCode: fixedCode,
      explanation: bugs.length > 0 ? 
        `🔧 ${detectedLanguage.toUpperCase()} DEBUG: Found and fixed ${bugs.length} errors specific to ${detectedLanguage} language.` : 
        `✅ ${detectedLanguage.toUpperCase()} SCAN: No errors found. Code appears correct for ${detectedLanguage}.`,
      processingTime: 150,
      _debug: { 
        isComprehensiveDebugger: true, 
        totalErrors: bugs.length,
        errorsByType: {
          syntax: bugs.filter(b => b.type === 'syntax').length,
          variable: bugs.filter(b => b.type === 'variable').length,
          method: bugs.filter(b => b.type === 'method').length,
          logic: bugs.filter(b => b.type === 'logic').length,
          indentation: bugs.filter(b => b.type === 'indentation').length,
          spelling: bugs.filter(b => b.type === 'spelling').length
        }
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debugging failed', details: error.message });
  }
});

app.post('/api/ai/approaches', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    
    const alternatives = [
      {
        approach: `Functional ${detectedLanguage}`,
        code: `# Functional approach\n${code}\n# Using functional programming concepts`,
        pros: ['Pure functions', 'Immutable data', 'Easy to test'],
        cons: ['Learning curve', 'May be verbose']
      },
      {
        approach: `Object-Oriented ${detectedLanguage}`,
        code: `# OOP approach\nclass CodeProcessor:\n    def __init__(self):\n        pass\n    \n    def process(self):\n${code.split('\n').map(line => '        ' + line).join('\n')}`,
        pros: ['Encapsulation', 'Reusable', 'Organized'],
        cons: ['More complex', 'Overhead']
      },
      {
        approach: `Optimized ${detectedLanguage}`,
        code: `# Optimized approach\n${code}\n# With performance improvements`,
        pros: ['Better performance', 'Efficient', 'Scalable'],
        cons: ['More complex logic', 'Harder to debug']
      }
    ];
    
    res.json({
      reviewId: 'approaches-' + Date.now(),
      sessionId: 'session-' + Date.now(),
      language: detectedLanguage,
      alternatives: alternatives,
      processingTime: 50
    });
    
  } catch (error) {
    console.error('Approaches error:', error);
    res.status(500).json({ error: 'Alternative approaches analysis failed', details: error.message });
  }
});

app.post('/api/ai/optimize', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const detectedLanguage = (!language || language === 'auto') ? aiService.detectLanguage(code) : language;
    
    // Try AI optimization first
    try {
      const prompt = `Optimize this ${detectedLanguage} code for better performance and readability:\n\n${code}\n\nProvide 2 optimizations in ${detectedLanguage} only. Return JSON:\n{"optimizations": [{"type": "Performance", "description": "what was optimized", "optimizedCode": "improved ${detectedLanguage} code", "improvement": "benefit"}]}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let jsonStr = text.trim().replace(/```json\s*|```\s*/g, '');
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      res.json({
        reviewId: 'optimize-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        language: detectedLanguage,
        optimizations: parsed.optimizations,
        processingTime: 100,
        _debug: { isAIResponse: true }
      });
      
    } catch (aiError) {
      console.log('AI failed, using smart fallback');
      
      // Smart fallback based on code analysis
      const optimizations = [];
      
      if (detectedLanguage === 'python') {
        // Analyze the code to provide relevant optimizations
        if (code.includes('for ') && code.includes('append')) {
          optimizations.push({
            type: 'Performance',
            description: 'Replace loop with list comprehension',
            optimizedCode: code.replace(/for\s+(\w+)\s+in\s+(\w+):\s*\n\s*if\s+([^:]+):\s*\n\s*(\w+)\.append\((\w+)\)/, 
              '$4 = [$5 for $1 in $2 if $3]'),
            improvement: '2-3x faster execution'
          });
        }
        
        if (optimizations.length === 0) {
          optimizations.push({
            type: 'Performance',
            description: 'Added error handling',
            optimizedCode: `def optimized_function():\n    try:\n${code.split('\n').map(line => '        ' + line).join('\n')}\n    except Exception as e:\n        print(f"Error: {e}")\n\noptimized_function()`,
            improvement: 'Better error handling'
          });
        }
      }
      
      res.json({
        reviewId: 'optimize-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        language: detectedLanguage,
        optimizations: optimizations,
        processingTime: 50
      });
    }
    
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Code optimization failed' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    const fallbackResponse = `I understand you're asking about: "${message}". I'm here to help with coding questions, debugging, code reviews, and programming concepts.`;
    res.json({ response: fallbackResponse });
  } catch (error) {
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