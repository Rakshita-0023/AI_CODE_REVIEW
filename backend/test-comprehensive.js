import { CodeAnalyzer } from './src/analyzers/codeAnalyzer.js';

const testCode = `let a = 5;
lt b  10;

lt sum = a + b;

console.log&quot;The sum is:&quot;, sum`;

console.log('Testing comprehensive JavaScript analyzer...');
const issues = CodeAnalyzer.analyzeCode(testCode, 'javascript');
console.log(`Found ${issues.length} issues:`);
issues.forEach((issue, i) => {
  console.log(`${i+1}. Line ${issue.line} [${issue.severity}]: ${issue.message}`);
});
