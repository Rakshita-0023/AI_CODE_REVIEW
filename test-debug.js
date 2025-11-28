// Test the debug logic
const code = `numbers = [10, 21, 32, 43, 54, 65, 76]
even_numbers = []
for num in numbers
  if num % 2 = 0:
    even_numbersappend(num)
print(&quot;Even numb&quot;)`;

const bugs = [];
let fixedCode = code;
const lines = code.split('\n');

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const trimmed = line.trim();
  
  // Missing colon
  if (trimmed.match(/^(for|if|while|def|class|elif|else|try|except|finally|with)\b/) && !trimmed.endsWith(':')) {
    bugs.push({
      line: lineNum,
      issue: `Missing colon (:) at end of ${trimmed.split(' ')[0]} statement`,
      fix: `Add colon: ${trimmed}:`
    });
    fixedCode = fixedCode.replace(line, line + ':');
  }
  
  // Assignment vs comparison
  if (trimmed.includes('if ') && trimmed.match(/\s=\s/) && !trimmed.includes('==')) {
    bugs.push({
      line: lineNum,
      issue: 'Assignment (=) used instead of comparison (==) in if statement',
      fix: 'Change = to == for comparison'
    });
    fixedCode = fixedCode.replace(line, line.replace(/\s=\s/, ' == '));
  }
  
  // Missing dot before method calls
  if (trimmed.match(/\w+append\(/)) {
    bugs.push({
      line: lineNum,
      issue: 'Missing dot (.) before method call',
      fix: 'Add dot before method name'
    });
    fixedCode = fixedCode.replace(/([a-zA-Z_]\w*)(append|remove|insert|pop|clear)\(/, '$1.$2(');
  }
  
  // HTML entities
  if (trimmed.includes('&quot;')) {
    bugs.push({
      line: lineNum,
      issue: 'HTML entities in print statement',
      fix: 'Replace &quot; with proper quotes'
    });
    fixedCode = fixedCode.replace(/&quot;/g, '"');
  }
});

console.log('Found bugs:', bugs.length);
console.log('Bugs:', bugs);
console.log('Fixed code:', fixedCode);