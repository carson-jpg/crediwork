import { getAccessToken } from './services/mpesaService.js';

async function testMpesaToken() {
  try {
    console.log('Testing M-Pesa access token...');
    const token = await getAccessToken();
    console.log('Access token obtained successfully:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
  } catch (error) {
    console.error('Failed to get access token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMpesaToken();
