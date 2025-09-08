import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function deleteAdmin2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crediwork');
    console.log('Connected to database');

    const result = await User.deleteOne({ email: 'admin2@crediwork.com' });
    console.log('Deleted:', result.deletedCount);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAdmin2();
