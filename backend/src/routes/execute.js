import express from 'express';
import codeExecutor from '../services/codeExecutor.js';

const router = express.Router();

// Execute code endpoint
router.post('/run', async (req, res) => {
  try {
    const { code, language, input = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

    // Execute the code
    const result = await codeExecutor.executeCode(code, language, input);
    
    // Generate suggestions for this code
    const suggestions = codeExecutor.generateSuggestions(code, language);

    res.json({
      success: result.success,
      output: result.output,
      language: result.language,
      suggestions: suggestions,
      executionTime: result.executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      error: 'Code execution failed',
      details: error.message 
    });
  }
});

// Get suggestions for code
router.post('/suggestions', (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

    const suggestions = codeExecutor.generateSuggestions(code, language);

    res.json({
      suggestions: suggestions,
      language: language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions' 
    });
  }
});

export default router;