// Simple test to verify the application setup
import axios from 'axios';

const API_BASE = 'http://localhost:5001';

async function testSetup() {
  console.log('🧪 Testing AI Code Reviewer Setup...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test AI analysis (mock)
    console.log('\n2. Testing AI analysis endpoint...');
    const testCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10));
    `.trim();

    const analysisResponse = await axios.post(`${API_BASE}/api/ai/review`, {
      code: testCode,
      language: 'javascript'
    });
    
    console.log('✅ AI analysis endpoint working');
    console.log('📊 Quality Score:', analysisResponse.data.qualityScore);
    console.log('🔍 Issues found:', analysisResponse.data.issues?.length || 0);

    console.log('\n🎉 All tests passed! Application is ready to use.');
    console.log('\n🌐 Open http://localhost:3000 to start using the application');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend is running:');
      console.log('   cd backend && npm run dev');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Check your AI API key configuration in .env file');
    }
  }
}

// Run tests
testSetup();