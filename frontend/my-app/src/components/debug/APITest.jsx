import { useState } from 'react';
import { aiAPI } from '../../services/api';

const APITest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test health endpoint first
      const healthResponse = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const healthData = await healthResponse.json();
      setResult(prev => prev + `\nHealth check: ${JSON.stringify(healthData)}`);
      
      // Test AI API
      const testCode = 'let x = 5; console.log(x);';
      const response = await aiAPI.reviewCode({ code: testCode, language: 'javascript' });
      setResult(prev => prev + `\nAI API Response: ${JSON.stringify(response.data, null, 2)}`);
      
    } catch (error) {
      setResult(prev => prev + `\nError: ${error.message}\nStack: ${error.stack}`);
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">API Connection Test</h3>
      <button 
        onClick={testAPI} 
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      <pre className="mt-4 p-4 bg-black text-green-400 rounded text-xs overflow-auto max-h-96">
        {result || 'Click button to test API connection...'}
      </pre>
    </div>
  );
};

export default APITest;