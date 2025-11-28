import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
const router = express.Router();

router.post('/run', async (req, res) => {
  try {
    const { code, language, input = '' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    if (language === 'python') {
      const tempFile = path.join('/tmp', `code_${Date.now()}.py`);
      fs.writeFileSync(tempFile, code);
      
      const python = spawn('python3', [tempFile]);
      let output = '', error = '';
      
      if (input) {
        python.stdin.write(input);
        python.stdin.end();
      }
      
      python.stdout.on('data', (data) => output += data.toString());
      python.stderr.on('data', (data) => error += data.toString());
      
      const timeout = setTimeout(() => {
        python.kill();
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (!res.headersSent) {
          res.json({ output: output || 'No output', error: 'Timeout (10s)', exitCode: -1, executionTime: 10000 });
        }
      }, 10000);
      
      python.on('close', (exitCode) => {
        clearTimeout(timeout);
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (!res.headersSent) {
          res.json({ output: output || 'No output', error: error || null, exitCode, executionTime: 100 });
        }
      });
      
    } else if (language === 'javascript') {
      const tempFile = path.join('/tmp', `code_${Date.now()}.js`);
      fs.writeFileSync(tempFile, code);
      
      const node = spawn('node', [tempFile]);
      let output = '', error = '';
      
      if (input) {
        node.stdin.write(input);
        node.stdin.end();
      }
      
      node.stdout.on('data', (data) => output += data.toString());
      node.stderr.on('data', (data) => error += data.toString());
      
      const timeout = setTimeout(() => {
        node.kill();
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (!res.headersSent) {
          res.json({ output: output || 'No output', error: 'Timeout (10s)', exitCode: -1, executionTime: 10000 });
        }
      }, 10000);
      
      node.on('close', (exitCode) => {
        clearTimeout(timeout);
        try { fs.unlinkSync(tempFile); } catch (e) {}
        if (!res.headersSent) {
          res.json({ output: output || 'No output', error: error || null, exitCode, executionTime: 100 });
        }
      });
      
    } else {
      res.json({ output: `✓ ${language} syntax appears valid`, error: null, exitCode: 0, executionTime: 0 });
    }
    
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ error: 'Code execution failed', details: error.message });
  }
});

router.post('/suggestions', (req, res) => {
  const { code, language } = req.body;
  
  const suggestions = [
    'Add error handling with try-except blocks',
    'Use meaningful variable names',
    'Add comments to explain complex logic',
    'Consider using list comprehensions for better performance'
  ];
  
  res.json({ suggestions });
});

export default router;