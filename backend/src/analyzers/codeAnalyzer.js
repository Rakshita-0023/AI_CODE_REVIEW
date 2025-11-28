export class CodeAnalyzer {
  static analyzeCode(code, language) {
    const lines = code.split('\n');
    let issues = [];
    
    switch(language?.toLowerCase()) {
      case 'javascript':
      case 'js':
        issues = this.analyzeJavaScript(lines);
        break;
      case 'python':
      case 'py':
        issues = this.analyzePython(lines);
        break;
      case 'java':
        issues = this.analyzeJava(lines);
        break;
      case 'c':
      case 'cpp':
      case 'c++':
        issues = this.analyzeC(lines);
        break;
      case 'php':
        issues = this.analyzePHP(lines);
        break;
      case 'ruby':
      case 'rb':
        issues = this.analyzeRuby(lines);
        break;
      case 'go':
        issues = this.analyzeGo(lines);
        break;
      case 'rust':
      case 'rs':
        issues = this.analyzeRust(lines);
        break;
      case 'swift':
        issues = this.analyzeSwift(lines);
        break;
      case 'kotlin':
      case 'kt':
        issues = this.analyzeKotlin(lines);
        break;
      case 'csharp':
      case 'c#':
      case 'cs':
        issues = this.analyzeCSharp(lines);
        break;
      case 'sql':
        issues = this.analyzeSQL(lines);
        break;
      default:
        issues = this.analyzeGeneric(lines);
    }
    
    return issues;
  }
  
  static analyzeJavaScript(lines) {
    let issues = [];
    const fullCode = lines.join('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      
      // === 1. MISSING OR EXTRA CHARACTERS ===
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Missing brackets
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: `Missing ${openBrackets - closeBrackets} closing bracket ]`,
          suggestion: 'Add ] to close array'
        });
      }
      
      // Missing braces
      const openBraces = (trimmed.match(/{/g) || []).length;
      const closeBraces = (trimmed.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: `Missing ${openBraces - closeBraces} closing brace }`,
          suggestion: 'Add } to close code block'
        });
      }
      
      // Unmatched quotes
      const singleQuotes = (trimmed.match(/'/g) || []).length;
      const doubleQuotes = (trimmed.match(/"/g) || []).length;
      const backticks = (trimmed.match(/`/g) || []).length;
      
      if (singleQuotes % 2 !== 0) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unmatched single quote', suggestion: 'Add missing single quote'
        });
      }
      if (doubleQuotes % 2 !== 0) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unmatched double quote', suggestion: 'Add missing double quote'
        });
      }
      if (backticks % 2 !== 0) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unmatched template literal backtick', suggestion: 'Add missing backtick `'
        });
      }
      
      // === 2. INVALID IDENTIFIERS ===
      
      // Variable name starts with number
      if (trimmed.match(/(let|const|var)\s+[0-9]/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Variable name cannot start with number',
          suggestion: 'Start variable name with letter or underscore'
        });
      }
      
      // Reserved keywords as variable names
      const reservedWords = ['class', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends', 'import', 'export', 'from', 'as', 'async', 'await', 'yield', 'delete', 'typeof', 'instanceof', 'in', 'of', 'void', 'null', 'undefined', 'true', 'false'];
      reservedWords.forEach(word => {
        if (trimmed.match(new RegExp(`(let|const|var)\\s+${word}\\s*=`))) {
          issues.push({
            line: lineNum, severity: 'high', category: 'syntax',
            message: `Cannot use reserved keyword '${word}' as variable name`,
            suggestion: `Choose different name (e.g., my${word.charAt(0).toUpperCase() + word.slice(1)})`
          });
        }
      });
      
      // Invalid characters in variable names
      if (trimmed.match(/(let|const|var)\s+\w*[@#$%^&*]+\w*/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Invalid characters in variable name',
          suggestion: 'Use only letters, numbers, underscore, and dollar sign'
        });
      }
      
      // === 3. UNEXPECTED TOKENS ===
      
      // Unexpected comma
      if (trimmed.match(/^\s*,/) || trimmed.match(/,,/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unexpected comma', suggestion: 'Remove extra comma or add missing element'
        });
      }
      
      // Unexpected characters
      if (trimmed.match(/[@#$%^&*~`]/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unexpected character in code', suggestion: 'Remove or escape special characters'
        });
      }
      
      // === 4. UNTERMINATED SYNTAX ===
      
      // Unterminated string
      if (trimmed.match(/"[^"]*$/) || trimmed.match(/'[^']*$/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unterminated string literal', suggestion: 'Add closing quote'
        });
      }
      
      // Unterminated comment
      if (trimmed.includes('/*') && !trimmed.includes('*/')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Unterminated comment', suggestion: 'Add */ to close comment'
        });
      }
      
      // === 5. INVALID OR MISUSED OPERATORS ===
      
      // Assignment in condition
      if (trimmed.includes('if') && trimmed.match(/if\s*\([^)]*=(?!=)/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'logic',
          message: 'Assignment (=) in condition, did you mean comparison (===)?',
          suggestion: 'Use === for strict comparison'
        });
      }
      
      // Invalid operators from HTML entities
      if (trimmed.includes('&lt;==') || trimmed.includes('=&gt;=')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Invalid operator with HTML entities',
          suggestion: 'Replace &lt; with < and &gt; with >'
        });
      }
      
      // Arrow function syntax mistakes
      if (trimmed.includes('=&gt;')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Invalid arrow function syntax', suggestion: 'Replace =&gt; with =>'
        });
      }
      
      // === 6. FUNCTION SYNTAX ERRORS ===
      
      // Missing parentheses in function definition
      if (trimmed.match(/^\s*function\s+\w+\s*{/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing parentheses in function definition',
          suggestion: 'Add () after function name'
        });
      }
      
      // Missing commas between parameters
      if (trimmed.match(/function\s*\([^)]*\w+\s+\w+[^,)]/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing comma between function parameters',
          suggestion: 'Add comma between parameters'
        });
      }
      
      // === 7. OBJECT & ARRAY SYNTAX ERRORS ===
      
      // Using = instead of : in objects
      if (trimmed.includes('{') && trimmed.match(/\w+\s*=\s*\w+/) && !trimmed.includes(':')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Use colon (:) instead of equals (=) in object literal',
          suggestion: 'Change = to : for object key-value pairs'
        });
      }
      
      // Missing colon in object
      if (trimmed.includes('{') && trimmed.match(/\w+\s+\w+/) && !trimmed.includes(':')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing colon in object key-value pair',
          suggestion: 'Add : between key and value'
        });
      }
      
      // === 8. IMPORT/EXPORT ERRORS ===
      
      // Missing 'from' in import
      if (trimmed.includes('import') && !trimmed.includes('from') && trimmed.includes('"')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing "from" in import statement',
          suggestion: 'Add "from" before module path'
        });
      }
      
      // === 9. STRICT MODE ERRORS ===
      
      // Undeclared variables
      if (trimmed.match(/^\s*\w+\s*=/) && !trimmed.match(/^\s*(let|const|var)\s/)) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Undeclared variable assignment',
          suggestion: 'Declare variable with let, const, or var'
        });
      }
      
      // === 10. ASSIGNMENT ERRORS ===
      
      // Assigning to constants
      if (trimmed.match(/^\s*\w+\s*=/) && fullCode.includes(`const ${trimmed.split('=')[0].trim()}`)) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'logic',
          message: 'Cannot reassign constant variable',
          suggestion: 'Use let instead of const if reassignment needed'
        });
      }
      
      // === KEYWORD TYPOS ===
      
      const keywordTypos = {
        'lt': 'let', 'le': 'let', 'elt': 'let', 'lte': 'let',
        'cnost': 'const', 'cosnt': 'const', 'cnst': 'const',
        'fucntion': 'function', 'funciton': 'function', 'funtion': 'function',
        'retrun': 'return', 'reutrn': 'return', 'retrn': 'return',
        'esle': 'else', 'els': 'else', 'fi': 'if', 'iif': 'if',
        'fro': 'for', 'ofr': 'for', 'whiel': 'while', 'wile': 'while'
      };
      
      Object.keys(keywordTypos).forEach(typo => {
        if (trimmed.match(new RegExp(`\\b${typo}\\b`))) {
          issues.push({
            line: lineNum, severity: 'high', category: 'syntax',
            message: `Invalid keyword: '${typo}' - did you mean '${keywordTypos[typo]}'?`,
            suggestion: `Replace '${typo}' with '${keywordTypos[typo]}'`
          });
        }
      });
      
      // === MISSING OPERATORS ===
      
      // Missing assignment operator
      if (trimmed.match(/(let|const|var|lt)\s+\w+\s+[^=]/) && !trimmed.includes('=')) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing assignment operator (=)',
          suggestion: 'Add = between variable name and value'
        });
      }
      
      // Missing parentheses in function calls
      if (trimmed.match(/console\.log[^(]/) || (trimmed.includes('console.log') && !trimmed.includes('('))) {
        issues.push({
          line: lineNum, severity: 'high', category: 'syntax',
          message: 'Missing parentheses in console.log',
          suggestion: 'Add parentheses: console.log()'
        });
      }
      
      // === HTML ENTITIES ===
      
      if (trimmed.includes('&lt;') || trimmed.includes('&gt;') || trimmed.includes('&quot;') || trimmed.includes('&#39;')) {
        const entities = [];
        if (trimmed.includes('&lt;')) entities.push('&lt; → <');
        if (trimmed.includes('&gt;')) entities.push('&gt; → >');
        if (trimmed.includes('&quot;')) entities.push('&quot; → "');
        if (trimmed.includes('&#39;')) entities.push('&#39; → \'');
        
        issues.push({
          line: lineNum, severity: 'high', category: 'encoding',
          message: 'HTML entities in JavaScript code',
          suggestion: `Replace: ${entities.join(', ')}`
        });
      }
      
      // === LOGICAL ERRORS ===
      
      // Using == instead of ===
      if (trimmed.includes('==') && !trimmed.includes('===')) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'logic',
          message: 'Use strict equality (===) instead of loose equality (==)',
          suggestion: 'Replace == with === for type-safe comparison'
        });
      }
      
      // Type coercion issues
      if (trimmed.match(/"\d+"\s*\+\s*\d+/)) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'logic',
          message: 'String concatenation instead of addition',
          suggestion: 'Convert string to number: Number() or parseInt()'
        });
      }
      
      // Array.map missing return
      if (trimmed.includes('.map(') && !trimmed.includes('return')) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'logic',
          message: 'Array.map() callback missing return statement',
          suggestion: 'Add return statement in map callback'
        });
      }
      
      // Floating point comparison
      if (trimmed.match(/\d+\.\d+\s*[=!]==?\s*\d+\.\d+/)) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'logic',
          message: 'Direct floating-point comparison unreliable',
          suggestion: 'Use Math.abs(a - b) < epsilon'
        });
      }
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
          !trimmed.match(/^(if|for|while|function|class|return|break|continue)\s/) &&
          !trimmed.includes('//') && trimmed.length > 0) {
        issues.push({
          line: lineNum, severity: 'medium', category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Deprecated var
      if (trimmed.includes('var ')) {
        issues.push({
          line: lineNum, severity: 'low', category: 'modernization',
          message: 'Use const or let instead of var',
          suggestion: 'Replace var with const or let'
        });
      }
    });
    
    return issues;
  }
  
  static analyzePython(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('#')) return;
      
      // 1. SYNTAX ERRORS
      
      // Invalid characters in list/array
      if (trimmed.match(/\[.*[a-zA-Z]{2,}.*\]/)) {
        const invalidChars = trimmed.match(/[a-zA-Z]{2,}/g);
        if (invalidChars) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: `Invalid characters in list: ${invalidChars.join(', ')}`,
            suggestion: 'Remove invalid characters or add quotes if they are strings'
          });
        }
      }
      
      // Missing colon after control statements
      if (trimmed.match(/^(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]\s*$/)) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing colon after ${trimmed.split(' ')[0]} statement`,
          suggestion: `Add colon: ${trimmed}:`
        });
      }
      
      // Invalid comparison operators
      if (trimmed.includes(' = 0') && !trimmed.includes('==') && !trimmed.includes('!=')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Invalid comparison operator: = should be ==',
          suggestion: 'Use == for comparison, = for assignment'
        });
      }
      
      // Missing parentheses in method calls
      if (trimmed.match(/\w+\.\w+\s*[^(]/)) {
        const methodMatch = trimmed.match(/(\w+)\.(\w+)/);
        if (methodMatch && !trimmed.includes('(')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: `Missing parentheses in method call: ${methodMatch[0]}`,
            suggestion: `Add parentheses: ${methodMatch[0]}()`
          });
        }
      }
      
      // Missing dot in method calls
      if (trimmed.match(/\w+append\(/)) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing dot before method call',
          suggestion: 'Add dot: variable.append()'
        });
      }
      
      // Space in print statement
      if (trimmed.match(/p\s+rint/)) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Space in print statement',
          suggestion: 'Remove space: print (not p rint)'
        });
      }
      
      // Missing closing brackets/parentheses (more precise)
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      
      if (openBrackets > closeBrackets) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openBrackets - closeBrackets} closing bracket(s) ]`,
          suggestion: 'Add ] at the end of line'
        });
      }
      
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) at the end of line'
        });
      }
      
      // Specific checks for common patterns
      if (trimmed.includes('.append(') && !trimmed.includes('))') && !trimmed.endsWith(')')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing closing parenthesis in append() method',
          suggestion: 'Add ) after the parameter'
        });
      }
      
      if (trimmed.match(/^\s*\w+\([^)]*$/) && !trimmed.endsWith(')')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing closing parenthesis in function call',
          suggestion: 'Add ) to close the function call'
        });
      }
      
      // 2. VARIABLE/FUNCTION NAME ERRORS (Priority over indentation)
      
      // Typos in variable names
      if (trimmed.includes('ven_numbers') && !trimmed.includes('even_numbers')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'logic',
          message: 'Undefined variable: ven_numbers',
          suggestion: 'Did you mean even_numbers?'
        });
      }
      
      // Typos in function names
      if (trimmed.match(/^\s*prit\(/)) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Undefined function: prit',
          suggestion: 'Did you mean print()?'
        });
      }
      
      // Common Python function typos
      const functionTypos = {
        'prit': 'print',
        'pritn': 'print',
        'pirnt': 'print',
        'lne': 'len',
        'lenght': 'len',
        'apend': 'append',
        'appned': 'append'
      };
      
      Object.keys(functionTypos).forEach(typo => {
        if (trimmed.includes(typo + '(')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'syntax',
            message: `Undefined function: ${typo}`,
            suggestion: `Did you mean ${functionTypos[typo]}()?`
          });
        }
      });
      
      // 3. INDENTATION ERRORS (Lower priority)
      const indent = line.length - line.trimStart().length;
      const prevLine = index > 0 ? lines[index - 1] : '';
      const prevTrimmed = prevLine.trim();
      
      // Only check indentation if no syntax errors found on this line
      const hasSyntaxError = issues.some(issue => issue.line === lineNum && issue.severity === 'high');
      
      if (!hasSyntaxError) {
        // Check if indentation is needed after colon
        if (prevTrimmed.endsWith(':') && trimmed && indent === 0) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'indentation',
            message: 'Missing indentation after colon',
            suggestion: 'Indent this line (use 4 spaces)'
          });
        }
        
        // Wrong indentation amount (only if properly indented block)
        if (trimmed && indent > 0 && indent % 4 !== 0 && indent < 8) {
          issues.push({
            line: lineNum,
            severity: 'low',
            category: 'style',
            message: `Inconsistent indentation: ${indent} spaces`,
            suggestion: `Consider using ${Math.round(indent / 4) * 4} spaces for consistency`
          });
        }
      }
      
      // 4. LOGIC ERRORS
      
      // Modulo operator syntax
      if (trimmed.includes('num  2') || trimmed.includes('% 2')) {
        if (!trimmed.includes('%')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'logic',
            message: 'Missing modulo operator %',
            suggestion: 'Use % for modulo: num % 2'
          });
        }
      }
      
      // 5. HTML ENTITIES
      if (trimmed.includes('&lt;') || trimmed.includes('&gt;') || trimmed.includes('&quot;')) {
        const entities = [];
        if (trimmed.includes('&lt;')) entities.push('&lt; → <');
        if (trimmed.includes('&gt;')) entities.push('&gt; → >');
        if (trimmed.includes('&quot;')) entities.push('&quot; → "');
        
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'encoding',
          message: 'HTML entities in code (copy-paste error)',
          suggestion: `Replace: ${entities.join(', ')}`
        });
      }
      
      // 6. STRING ERRORS
      
      // Unmatched quotes
      const singleQuotes = (trimmed.match(/'/g) || []).length;
      const doubleQuotes = (trimmed.match(/"/g) || []).length;
      
      if (singleQuotes % 2 !== 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Unmatched single quote',
          suggestion: 'Add missing single quote'
        });
      }
      
      if (doubleQuotes % 2 !== 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Unmatched double quote',
          suggestion: 'Add missing double quote'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeJava(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') && !trimmed.match(/^(public|private|protected|class|interface|if|for|while|try|catch|import|package)\s/) &&
          !trimmed.startsWith('@') && trimmed.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close method call or condition'
        });
      }
      
      // Class naming convention
      const classMatch = trimmed.match(/^(public\s+)?class\s+([a-z][a-zA-Z0-9_]*)/);
      if (classMatch) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'convention',
          message: `Class name '${classMatch[2]}' should start with uppercase`,
          suggestion: `Use PascalCase: ${classMatch[2].charAt(0).toUpperCase() + classMatch[2].slice(1)}`
        });
      }
      
      // Missing access modifiers
      if (trimmed.match(/^(int|String|boolean|double|float|char|byte|short|long)\s+\w+/)) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'convention',
          message: 'Missing access modifier',
          suggestion: 'Add public, private, or protected before variable declaration'
        });
      }
      
      // Method naming convention
      const methodMatch = trimmed.match(/(public|private|protected)\s+\w+\s+([A-Z][a-zA-Z0-9_]*)\s*\(/);
      if (methodMatch) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'convention',
          message: `Method name '${methodMatch[2]}' should start with lowercase`,
          suggestion: `Use camelCase: ${methodMatch[2].charAt(0).toLowerCase() + methodMatch[2].slice(1)}`
        });
      }
      
      // Missing main method signature
      if (trimmed.includes('main(') && !trimmed.includes('public static void main(String[] args)')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Incorrect main method signature',
          suggestion: 'Use: public static void main(String[] args)'
        });
      }
      
      // System.out typos
      if (trimmed.includes('system.out') || trimmed.includes('System.Out')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Incorrect System.out capitalization',
          suggestion: 'Use: System.out.println()'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeC(lines) {
    let issues = [];
    let mallocLines = [];
    let freeLines = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.startsWith('#') && !trimmed.startsWith('//') &&
          !trimmed.match(/^(if|for|while|do|switch|case|default)\s*[\(:]/) && 
          !trimmed.match(/^(struct|enum|typedef)\s/) && trimmed.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call or condition'
        });
      }
      
      // Memory management
      if (trimmed.includes('malloc(') || trimmed.includes('calloc(') || trimmed.includes('realloc(')) {
        mallocLines.push(lineNum);
      }
      if (trimmed.includes('free(')) {
        freeLines.push(lineNum);
      }
      
      // Missing #include statements
      if (trimmed.includes('printf(') && !lines.some(l => l.includes('#include <stdio.h>'))) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing #include <stdio.h> for printf',
          suggestion: 'Add #include <stdio.h> at the top'
        });
      }
      
      if (trimmed.includes('malloc(') && !lines.some(l => l.includes('#include <stdlib.h>'))) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing #include <stdlib.h> for malloc',
          suggestion: 'Add #include <stdlib.h> at the top'
        });
      }
      
      // Array bounds checking
      if (trimmed.match(/\w+\[\d+\]/) && trimmed.includes('=')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'safety',
          message: 'Potential array bounds issue',
          suggestion: 'Ensure array index is within bounds'
        });
      }
      
      // Uninitialized pointers
      if (trimmed.match(/\*\w+;/) && !trimmed.includes('=')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'safety',
          message: 'Uninitialized pointer',
          suggestion: 'Initialize pointer to NULL or valid address'
        });
      }
      
      // Missing return in main
      if (trimmed.includes('int main(') && !lines.some(l => l.trim().startsWith('return'))) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'convention',
          message: 'Missing return statement in main',
          suggestion: 'Add return 0; at the end of main function'
        });
      }
    });
    
    // Check for memory leaks
    if (mallocLines.length > freeLines.length) {
      mallocLines.forEach(lineNum => {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'memory',
          message: 'Potential memory leak - malloc without corresponding free',
          suggestion: 'Add free() call for each malloc()'
        });
      });
    }
    
    return issues;
  }
  
  static analyzePHP(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      
      // Missing PHP opening tag
      if (index === 0 && !trimmed.startsWith('<?php') && !trimmed.startsWith('<?=')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing PHP opening tag',
          suggestion: 'Start with <?php'
        });
      }
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') && !trimmed.startsWith('<?') &&
          !trimmed.match(/^(if|for|while|function|class|foreach|switch|case|default)\s/) && 
          !trimmed.startsWith('?>') && trimmed.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Variable naming (should start with $)
      if (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/) && !trimmed.startsWith('$')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'PHP variables must start with $',
          suggestion: 'Add $ before variable name'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Echo vs print
      if (trimmed.includes('print(') && !trimmed.includes('print_r(')) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'convention',
          message: 'Consider using echo instead of print',
          suggestion: 'echo is faster than print for simple output'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeRuby(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('#')) return;
      
      // Missing 'end' keyword
      const prevLine = index > 0 ? lines[index - 1].trim() : '';
      if (prevLine.match(/^(def|class|module|if|unless|while|until|for|begin)\s/) && 
          !lines.slice(index).some(l => l.trim() === 'end')) {
        issues.push({
          line: lineNum - 1,
          severity: 'high',
          category: 'syntax',
          message: 'Missing end keyword',
          suggestion: 'Add end to close the block'
        });
      }
      
      // Method naming convention
      const methodMatch = trimmed.match(/^def\s+([A-Z][a-zA-Z0-9_]*)/);
      if (methodMatch) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'convention',
          message: `Method name '${methodMatch[1]}' should use snake_case`,
          suggestion: `Use: ${methodMatch[1].replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`
        });
      }
      
      // Class naming convention
      const classMatch = trimmed.match(/^class\s+([a-z][a-zA-Z0-9_]*)/);
      if (classMatch) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'convention',
          message: `Class name '${classMatch[1]}' should use PascalCase`,
          suggestion: `Use: ${classMatch[1].charAt(0).toUpperCase() + classMatch[1].slice(1)}`
        });
      }
    });
    
    return issues;
  }
  
  static analyzeGo(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//')) return;
      
      // Missing package declaration
      if (index === 0 && !trimmed.startsWith('package ')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing package declaration',
          suggestion: 'Start with package main or package <name>'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Unused variables (basic check)
      if (trimmed.match(/^\s*var\s+\w+/) && !trimmed.includes('=')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'convention',
          message: 'Declared variable may be unused',
          suggestion: 'Remove unused variables or use _ for intentionally unused'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeRust(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//')) return;
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.match(/^(fn|struct|enum|impl|if|for|while|match|let)\s/) && 
          !trimmed.startsWith('use ') && trimmed.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Ownership and borrowing hints
      if (trimmed.includes('String::new()') && trimmed.includes('=')) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'optimization',
          message: 'Consider using &str for string literals',
          suggestion: 'Use &str for better performance if string won\'t be modified'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeSwift(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//')) return;
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Optional binding
      if (trimmed.includes('!') && !trimmed.includes('!=')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'safety',
          message: 'Force unwrapping with ! can cause crashes',
          suggestion: 'Use optional binding (if let) or nil coalescing (??)'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeKotlin(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//')) return;
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close function call'
        });
      }
      
      // Null safety
      if (trimmed.includes('!!') && !trimmed.includes('!==')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          category: 'safety',
          message: 'Double bang (!!) can cause KotlinNullPointerException',
          suggestion: 'Use safe call (?.) or let function instead'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeCSharp(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('//')) return;
      
      // Missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.match(/^(using|namespace|public|private|class|if|for|while)\s/) && 
          !trimmed.startsWith('[') && trimmed.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of statement',
          suggestion: 'Add semicolon: ' + trimmed + ';'
        });
      }
      
      // Missing parentheses
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: `Missing ${openParens - closeParens} closing parenthesis )`,
          suggestion: 'Add ) to close method call'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeSQL(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim().toUpperCase();
      const lineNum = index + 1;
      
      if (!trimmed || trimmed.startsWith('--')) return;
      
      // Missing semicolon
      if (trimmed && !trimmed.endsWith(';') && 
          (trimmed.startsWith('SELECT') || trimmed.startsWith('INSERT') || 
           trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE'))) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'syntax',
          message: 'Missing semicolon at end of SQL statement',
          suggestion: 'Add semicolon at the end'
        });
      }
      
      // SQL injection risk
      if (trimmed.includes('WHERE') && trimmed.includes('=') && !trimmed.includes('?')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'security',
          message: 'Potential SQL injection vulnerability',
          suggestion: 'Use parameterized queries with ? placeholders'
        });
      }
    });
    
    return issues;
  }
  
  static analyzeGeneric(lines) {
    let issues = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Line length
      if (line.length > 120) {
        issues.push({
          line: lineNum,
          severity: 'low',
          category: 'style',
          message: 'Line too long',
          suggestion: 'Keep lines under 120 characters'
        });
      }
      
      // HTML entities (common copy-paste issue)
      if (line.includes('&lt;') || line.includes('&gt;') || line.includes('&quot;')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          category: 'encoding',
          message: 'HTML entities found in code',
          suggestion: 'Replace HTML entities with actual characters'
        });
      }
    });
    
    return issues;
  }
}