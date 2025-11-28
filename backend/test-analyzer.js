import { CodeAnalyzer } from './src/analyzers/codeAnalyzer.js';

const testCode = `numbers = [10, 21, 32, 43, 54, 65, 76]

even_numbers = [
i = 0

while i &lt; len(numbers)
    if numbers[i] % 2 == 0:
        even_numbers.append(numbers[i])
    i += 1

print(&quot;Even numbersers:&quot;, even_numbers)

print(even_numbers)`;

console.log('Testing analyzer...');
const issues = CodeAnalyzer.analyzeCode(testCode, 'python');
console.log('Found issues:', issues.length);
console.log(JSON.stringify(issues, null, 2));