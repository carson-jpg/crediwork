import 'dotenv/config';

console.log('=== Environment Variables Check ===');
console.log('MPESA_CONSUMER_KEY:', process.env.MPESA_CONSUMER_KEY ? 'Set' : 'Not set');
console.log('MPESA_CONSUMER_SECRET:', process.env.MPESA_CONSUMER_SECRET ? 'Set' : 'Not set');
console.log('MPESA_SHORTCODE:', process.env.MPESA_SHORTCODE);
console.log('MPESA_PASSKEY:', process.env.MPESA_PASSKEY ? 'Set' : 'Not set');
console.log('MPESA_ENV:', process.env.MPESA_ENV);
console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const baseUrls = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

const baseUrl = process.env.MPESA_ENV === 'production' ? baseUrls.production : baseUrls.sandbox;
console.log('Using base URL:', baseUrl);

console.log('=== End Environment Variables Check ===');
