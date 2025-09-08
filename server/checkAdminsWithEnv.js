import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDB } from './config/database.js';

async function checkAdmins() {
  try {
    await connectDB();
    console.log('Connected to database');

    const admins = await User.find({ role: 'admin' });
    console.log(`Admin accounts found: ${admins.length}`);

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName} - ${admin.email} - Status: ${admin.status}`);
      console.log(`   Password hash: ${admin.password.substring(0, 20)}...`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmins();
