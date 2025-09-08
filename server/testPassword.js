import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './config/database.js';

async function testPassword() {
  try {
    await connectDB();
    console.log('Connected to database');

    const user = await User.findOne({ email: 'admin1@crediwork.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email);
    console.log('Password hash:', user.password);

    const isValid = await user.comparePassword('Admin123!');
    console.log('Password comparison result:', isValid);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();
