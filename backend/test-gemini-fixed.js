import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with Gemini 2.0 Flash Experimental
    console.log('🧪 Testing Gemini 2.0 Flash Experimental...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = 'Hello! Can you help me with JavaScript code review?';
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('✅ Gemini 2.0 Flash Experimental working!');
    console.log('📝 Response:', response.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    
    // Try fallback model
    try {
      console.log('🔄 Trying fallback model: gemini-1.5-flash...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = 'Hello! Can you help me with JavaScript code review?';
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('✅ Fallback model working!');
      console.log('📝 Response:', response.substring(0, 100) + '...');
      
    } catch (fallbackError) {
      console.error('❌ Fallback model also failed:', fallbackError.message);
    }
  }
}

testGemini();