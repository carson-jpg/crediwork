import dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables Check:');
console.log('MPESA_CONSUMER_KEY:', process.env.MPESA_CONSUMER_KEY ? 'Set' : 'NOT SET');
console.log('MPESA_CONSUMER_SECRET:', process.env.MPESA_CONSUMER_SECRET ? 'Set' : 'NOT SET');
console.log('MPESA_SHORTCODE:', process.env.MPESA_SHORTCODE ? 'Set' : 'NOT SET');
console.log('MPESA_PASSKEY:', process.env.MPESA_PASSKEY ? 'Set' : 'NOT SET');
console.log('MPESA_ENV:', process.env.MPESA_ENV || 'NOT SET');
console.log('MPESA_CALLBACK_URL:', process.env.MPESA_CALLBACK_URL || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
