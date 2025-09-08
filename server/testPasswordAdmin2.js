import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './config/database.js';

async function testPasswordAdmin2() {
  try {
    await connectDB();
    console.log('Connected to database');

    const user = await User.findOne({ email: 'admin2@crediwork.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Password hash:', user.password);

    const isValid = await user.comparePassword('Admin456!');
    console.log('Password comparison result:', isValid);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPasswordAdmin2();
