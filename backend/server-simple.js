import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/ai/review', (req, res) => {
  const { code, language } = req.body;
  let issues = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check for missing semicolons in JavaScript
    if (language === 'javascript' && trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.startsWith('//') && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while') && !trimmed.startsWith('function') && !trimmed.startsWith('const') && !trimmed.startsWith('let') && !trimmed.startsWith('var')) {
      issues.push({
        line: index + 1,
        severity: 'medium',
        category: 'style',
        message: 'Missing semicolon',
        suggestion: 'Add semicolon at end of statement'
      });
    }
    
    // Check for missing colons in Python
    if (language === 'python' && trimmed.match(/^(if|for|while|def|class|try|except|with)\s+.*[^:]$/)) {
      issues.push({
        line: index + 1,
        severity: 'high',
        category: 'syntax',
        message: 'Missing colon at end of statement',
        suggestion: 'Add colon (:) at the end'
      });
    }
    
    // Check for undefined variables
    if (trimmed.includes('console.log(') && !trimmed.includes('"') && !trimmed.includes("'")) {
      const match = trimmed.match(/console\.log\(([^)]+)\)/);
      if (match && match[1] && !match[1].includes('"') && !match[1].includes("'")) {
        issues.push({
          line: index + 1,
          severity: 'medium',
          category: 'logic',
          message: 'Potential undefined variable',
          suggestion: 'Check if variable is defined'
        });
      }
    }
  });
  
  if (issues.length === 0) {
    issues = [{
      line: 1,
      severity: 'info',
      category: 'general',
      message: `✅ ${(language || 'Code').toUpperCase()} looks good`,
      suggestion: 'No issues detected'
    }];
  }
  
  res.json({
    reviewId: 'review-' + Date.now(),
    language: language || 'javascript',
    qualityScore: Math.max(50, 100 - (issues.filter(i => i.severity !== 'info').length * 15)),
    issues,
    summary: issues.length === 1 && issues[0].severity === 'info' ? 'Code quality is excellent' : `Found ${issues.filter(i => i.severity !== 'info').length} issue(s)`
  });
});

app.post('/api/ai/debug', (req, res) => {
  const { code, language } = req.body;
  let bugs = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // JavaScript debugging
    if (language === 'javascript') {
      if (trimmed.includes('console.log') && !trimmed.includes('(')) {
        bugs.push({
          line: index + 1,
          type: 'syntax',
          severity: 'high',
          issue: 'Incomplete console.log statement',
          fix: 'Add parentheses: console.log()',
          code: 'console.log()'
        });
      }
      if (trimmed.match(/^(if|for|while)\s*\([^)]*\)\s*$/)) {
        bugs.push({
          line: index + 1,
          type: 'syntax',
          severity: 'high',
          issue: 'Missing code block',
          fix: 'Add curly braces { }',
          code: trimmed + ' { }'
        });
      }
    }
    
    // Python debugging
    if (language === 'python') {
      if (trimmed.match(/^(if|for|while|def|class|try|except|with)\s+.*[^:]$/)) {
        bugs.push({
          line: index + 1,
          type: 'syntax',
          severity: 'high',
          issue: 'Missing colon after control statement',
          fix: 'Add : at the end',
          code: trimmed + ':'
        });
      }
      if (trimmed.includes('print') && !trimmed.includes('(')) {
        bugs.push({
          line: index + 1,
          type: 'syntax',
          severity: 'medium',
          issue: 'Python 3 requires parentheses for print',
          fix: 'Use print() instead of print',
          code: trimmed.replace('print ', 'print(')
        });
      }
    }
  });
  
  if (bugs.length === 0) {
    bugs = [{
      line: 1,
      type: 'info',
      severity: 'low',
      issue: 'No errors detected',
      fix: 'Code appears correct',
      code: ''
    }];
  }
  
  res.json({
    reviewId: 'debug-' + Date.now(),
    language: language || 'javascript',
    bugs,
    fixedCode: code,
    explanation: bugs.length === 1 && bugs[0].type === 'info' ? '✅ No errors found' : `Found ${bugs.filter(b => b.type !== 'info').length} bug(s)`
  });
});

app.post('/api/ai/approaches', (req, res) => {
  const { code, language } = req.body;
  res.json({
    reviewId: 'approaches-' + Date.now(),
    language: language,
    alternatives: [{
      approach: `Modern ${language}`,
      code: code,
      pros: ['Clean', 'Readable'],
      cons: ['None']
    }]
  });
});

app.post('/api/ai/optimize', (req, res) => {
  const { code, language } = req.body;
  let optimizations = [];
  
  if (language === 'javascript') {
    if (code.includes('var ')) {
      optimizations.push({
        type: 'Modern Syntax',
        description: 'Replace var with const/let',
        optimizedCode: code.replace(/var /g, 'const '),
        improvement: 'Better scoping'
      });
    }
    if (code.includes('function(')) {
      optimizations.push({
        type: 'ES6 Features',
        description: 'Use arrow functions',
        optimizedCode: code.replace(/function\s*\(/g, '() => '),
        improvement: 'Shorter syntax'
      });
    }
  }
  
  if (language === 'python') {
    if (code.includes('range(len(')) {
      optimizations.push({
        type: 'Pythonic Code',
        description: 'Use enumerate instead of range(len())',
        optimizedCode: code.replace(/range\(len\(([^)]+)\)\)/g, 'enumerate($1)'),
        improvement: 'More readable'
      });
    }
  }
  
  if (optimizations.length === 0) {
    optimizations = [{
      type: 'Code Quality',
      description: 'Code is well-structured',
      optimizedCode: code,
      improvement: 'No optimizations needed'
    }];
  }
  
  res.json({
    reviewId: 'optimize-' + Date.now(),
    language: language,
    optimizations
  });
});

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});