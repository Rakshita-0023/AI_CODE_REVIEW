import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with Gemini 2.5 Flash
    const models = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of models) {
      try {
        console.log(`🧪 Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = 'Hello! Can you help me with code review?';
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        console.log(`✅ ${modelName} working!`);
        console.log('📝 Response:', response.substring(0, 100) + '...\n');
        break;
        
      } catch (error) {
        console.log(`❌ ${modelName} failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

listModels();