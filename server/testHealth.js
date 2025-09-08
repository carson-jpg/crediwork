import fetch from 'node-fetch';

async function testHealth() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('Health check response:', data);
  } catch (error) {
    console.error('Health check error:', error);
  }
}

testHealth();
