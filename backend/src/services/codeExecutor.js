import { PythonShell } from 'python-shell';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async executeJavaScript(code, input = '') {
    try {
      let output = '';
      const originalLog = console.log;
      
      // Capture console.log output
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      try {
        // Parse input for function calls
        const inputArgs = input ? input.split(',').map(s => s.trim()) : [];
        
        // Create execution context with input
        const func = new Function('inputArgs', `
          ${code}
          
          // Try to call functions with input
          if (typeof add === 'function' && inputArgs.length >= 2) {
            return add(Number(inputArgs[0]), Number(inputArgs[1]));
          }
          if (typeof factorial === 'function' && inputArgs.length >= 1) {
            return factorial(Number(inputArgs[0]));
          }
          if (typeof main === 'function') {
            return main(...inputArgs);
          }
        `);
        
        const result = func(inputArgs);
        if (result !== undefined) {
          output += result;
        }
      } catch (error) {
        throw error;
      } finally {
        console.log = originalLog;
      }

      return output.trim() || 'No output';
    } catch (error) {
      throw new Error(`JavaScript execution error: ${error.message}`);
    }
  }

  async executePython(code, input = '') {
    return new Promise((resolve, reject) => {
      try {
        // Create temporary Python file
        const tempFile = path.join(this.tempDir, `temp_${Date.now()}.py`);
        
        // Clean and prepare Python code
        let pythonCode = code.trim();
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, pythonCode);
        
        // Execute Python code with increased timeout and proper error handling
        const child = exec(`python3 "${tempFile}"`, { 
          timeout: 30000, // Increased to 30 seconds
          maxBuffer: 1024 * 1024 // 1MB buffer for large outputs
        }, (err, stdout, stderr) => {
          
          // Clean up temporary file
          try {
            fs.unlinkSync(tempFile);
          } catch (cleanupError) {
            console.warn('Failed to cleanup temp file:', cleanupError);
          }
          
          if (err) {
            if (err.killed && err.signal === 'SIGTERM') {
              reject(new Error('Python execution timeout (30 seconds)'));
            } else if (stderr) {
              reject(new Error(`Python execution error: ${stderr}`));
            } else {
              reject(new Error(`Python execution error: ${err.message}`));
            }
            return;
          }
          
          const output = stdout.trim() || 'Code executed successfully (no output)';
          resolve(output);
        });
        
        // Handle input if provided
        if (input && input.trim()) {
          child.stdin.write(input + '\n');
          child.stdin.end();
        }
        
      } catch (error) {
        reject(new Error(`Python setup error: ${error.message}`));
      }
    });
  }

  async executeJava(code, input = '') {
    return new Promise((resolve, reject) => {
      try {
        // Create temporary Java file
        const className = 'TempClass';
        const tempFile = path.join(this.tempDir, `${className}.java`);
        
        // Wrap code in a class if not already wrapped
        let javaCode = code;
        if (!code.includes('class ') && !code.includes('public class')) {
          javaCode = `
public class ${className} {
    public static void main(String[] args) {
        ${code}
    }
}
`;
        }
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, javaCode);
        
        // Compile Java code
        exec(`javac "${tempFile}"`, (compileErr) => {
          if (compileErr) {
            // Clean up
            try { fs.unlinkSync(tempFile); } catch {}
            reject(new Error(`Java compilation error: ${compileErr.message}`));
            return;
          }
          
          // Execute compiled Java code
          exec(`java -cp "${this.tempDir}" ${className}`, (execErr, stdout, stderr) => {
            // Clean up
            try {
              fs.unlinkSync(tempFile);
              fs.unlinkSync(path.join(this.tempDir, `${className}.class`));
            } catch {}
            
            if (execErr) {
              reject(new Error(`Java execution error: ${stderr || execErr.message}`));
              return;
            }
            
            resolve(stdout || 'No output');
          });
        });
        
      } catch (error) {
        reject(new Error(`Java setup error: ${error.message}`));
      }
    });
  }

  async executeCpp(code, input = '') {
    return new Promise((resolve, reject) => {
      try {
        const tempFile = path.join(this.tempDir, `temp_${Date.now()}.cpp`);
        const execFile = path.join(this.tempDir, `temp_${Date.now()}`);
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, code);
        
        // Compile C++ code
        exec(`g++ "${tempFile}" -o "${execFile}"`, (compileErr) => {
          if (compileErr) {
            // Clean up
            try { fs.unlinkSync(tempFile); } catch {}
            reject(new Error(`C++ compilation error: ${compileErr.message}`));
            return;
          }
          
          // Execute compiled C++ code
          exec(`"${execFile}"`, (execErr, stdout, stderr) => {
            // Clean up
            try {
              fs.unlinkSync(tempFile);
              fs.unlinkSync(execFile);
            } catch {}
            
            if (execErr) {
              reject(new Error(`C++ execution error: ${stderr || execErr.message}`));
              return;
            }
            
            resolve(stdout || 'No output');
          });
        });
        
      } catch (error) {
        reject(new Error(`C++ setup error: ${error.message}`));
      }
    });
  }

  async executeCSharp(code, input = '') {
    return new Promise((resolve, reject) => {
      try {
        const tempFile = path.join(this.tempDir, `temp_${Date.now()}.cs`);
        
        // Wrap code in a class if not already wrapped
        let csharpCode = code;
        if (!code.includes('class ') && !code.includes('namespace')) {
          csharpCode = `
using System;

class Program {
    static void Main() {
        ${code}
    }
}
`;
        }
        
        // Write code to temporary file
        fs.writeFileSync(tempFile, csharpCode);
        
        // Compile and run C# code (requires mono or dotnet)
        exec(`dotnet run --project "${tempFile}" || mono "${tempFile}"`, (execErr, stdout, stderr) => {
          // Clean up
          try { fs.unlinkSync(tempFile); } catch {}
          
          if (execErr) {
            reject(new Error(`C# execution error: ${stderr || execErr.message}`));
            return;
          }
          
          resolve(stdout || 'No output');
        });
        
      } catch (error) {
        reject(new Error(`C# setup error: ${error.message}`));
      }
    });
  }

  async executeGeneric(code, language, input = '') {
    // For unsupported languages, provide simulated execution with better messages
    const simulatedResults = {
      php: 'PHP execution requires PHP interpreter setup',
      ruby: 'Ruby execution requires Ruby interpreter setup',
      go: 'Go execution requires Go compiler setup',
      rust: 'Rust execution requires Rust compiler setup',
      kotlin: 'Kotlin execution requires Kotlin compiler setup',
      swift: 'Swift execution requires Swift compiler setup',
      sql: 'SQL execution requires database connection setup'
    };
    
    const message = simulatedResults[language] || `${language} execution not yet implemented`;
    return `Simulated execution: ${message}\n\nTo enable real execution for ${language}, please install the required compiler/interpreter.`;
  }

  generateSuggestions(code, language) {
    const suggestions = { input: '', output: '' };
    
    if (!code.trim()) return suggestions;

    if (language === 'javascript') {
      // JavaScript patterns
      if (code.includes('console.log(2 + 3)')) {
        suggestions.output = '5';
      } else if (code.includes('function add') || code.includes('const add')) {
        suggestions.input = '2, 3';
        suggestions.output = '5';
      } else if (code.includes('factorial')) {
        suggestions.input = '5';
        suggestions.output = '120';
      } else if (code.includes('.length')) {
        suggestions.input = 'hello';
        suggestions.output = '5';
      } else if (code.match(/console\.log\((\d+)\s*\+\s*(\d+)\)/)) {
        const match = code.match(/console\.log\((\d+)\s*\+\s*(\d+)\)/);
        suggestions.output = String(parseInt(match[1]) + parseInt(match[2]));
      }
    } else if (language === 'python') {
      // Python patterns
      if (code.includes('def add')) {
        suggestions.input = '2, 3';
        suggestions.output = '5';
      } else if (code.includes('def factorial')) {
        suggestions.input = '5';
        suggestions.output = '120';
      } else if (code.includes('print(2 + 3)')) {
        suggestions.output = '5';
      } else if (code.includes('len(')) {
        suggestions.input = 'hello';
        suggestions.output = '5';
      } else if (code.includes('def sum') || code.includes('def total')) {
        suggestions.input = '1, 2, 3';
        suggestions.output = '6';
      } else if (code.includes('binary tree') || code.includes('TreeNode')) {
        suggestions.input = '[1,2,3,4,5]';
        suggestions.output = '15';
      } else if (code.includes('def fibonacci')) {
        suggestions.input = '6';
        suggestions.output = '8';
      } else if (code.match(/print\((\d+)\s*\+\s*(\d+)\)/)) {
        const match = code.match(/print\((\d+)\s*\+\s*(\d+)\)/);
        suggestions.output = String(parseInt(match[1]) + parseInt(match[2]));
      }
    } else if (language === 'java') {
      // Java patterns
      if (code.includes('public static int add')) {
        suggestions.input = '2, 3';
        suggestions.output = '5';
      } else if (code.includes('System.out.println')) {
        if (code.includes('2 + 3')) suggestions.output = '5';
      } else if (code.includes('factorial')) {
        suggestions.input = '5';
        suggestions.output = '120';
      }
    } else if (language === 'cpp' || language === 'c') {
      // C++ patterns
      if (code.includes('int add')) {
        suggestions.input = '2, 3';
        suggestions.output = '5';
      } else if (code.includes('cout')) {
        if (code.includes('2 + 3')) suggestions.output = '5';
      } else if (code.includes('factorial')) {
        suggestions.input = '5';
        suggestions.output = '120';
      }
    } else if (language === 'csharp') {
      // C# patterns
      if (code.includes('static int Add')) {
        suggestions.input = '2, 3';
        suggestions.output = '5';
      } else if (code.includes('Console.WriteLine')) {
        if (code.includes('2 + 3')) suggestions.output = '5';
      }
    }

    return suggestions;
  }

  async executeCode(code, language, input = '') {
    try {
      let output;
      
      switch (language) {
        case 'javascript':
          output = await this.executeJavaScript(code, input);
          break;
        case 'python':
          output = await this.executePython(code, input);
          break;
        case 'java':
          output = await this.executeJava(code, input);
          break;
        case 'cpp':
        case 'c':
          output = await this.executeCpp(code, input);
          break;
        case 'csharp':
          output = await this.executeCSharp(code, input);
          break;
        default:
          output = await this.executeGeneric(code, language, input);
          break;
      }
      
      return {
        success: true,
        output: output,
        language: language,
        executionTime: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        output: `Error: ${error.message}`,
        language: language,
        executionTime: Date.now()
      };
    }
  }
}

export default new CodeExecutor();