import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names
    const modelNames = ['gemini-pro', 'gemini-1.0-pro', 'text-bison-001'];
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, can you help me with JavaScript?');
        console.log(`✅ ${modelName} working!`);
        console.log('Response:', result.response.text());
        return;
      } catch (error) {
        console.log(`❌ ${modelName} failed:`, error.message);
      }
    }
    
    console.log('All models failed');
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testGemini();