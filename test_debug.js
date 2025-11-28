const axios = require('axios');

const testCode = `for i in range(10)
    if i = 5
        numbersappend(i)
        prnit("Found number")`;

async function testDebug() {
  try {
    const response = await axios.post('http://localhost:5001/api/ai/debug', {
      code: testCode,
      language: 'python'
    });
    
    console.log('Debug Response:');
    console.log('Bugs found:', response.data.bugs?.length || 0);
    console.log('Bugs:', JSON.stringify(response.data.bugs, null, 2));
    console.log('Fixed code:', response.data.fixedCode);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDebug();