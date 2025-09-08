import fetch from 'node-fetch';

async function testPayment() {
  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'aiisavameshack@gmail.com',
        password: '123123',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const token = loginData.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Now test the payment endpoint
    console.log('\nTesting payment endpoint...');
    const paymentResponse = await fetch('http://localhost:3001/api/payment/stkpush', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        phoneNumber: '254716608367', // Valid sandbox test number
        amount: 1000,
      }),
    });

    const paymentData = await paymentResponse.json();
    console.log('Payment response status:', paymentResponse.status);
    console.log('Payment response data:', JSON.stringify(paymentData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testPayment();
