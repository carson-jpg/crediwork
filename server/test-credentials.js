import 'dotenv/config';
import axios from 'axios';

// Function to get access token
async function getAccessToken() {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: {
                Authorization: `Basic ${auth}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Test function
async function testCredentials() {
    try {
        console.log('Testing M-Pesa credentials...');
        const token = await getAccessToken();
        console.log('Access token obtained successfully:', token);
        console.log('Credentials are valid!');
    } catch (error) {
        console.log('Failed to obtain access token. Please check your credentials.');
    }
}

testCredentials();
