import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const adminUsers = [
  {
    email: 'admin1@crediwork.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    phone: '+254700000001',
    role: 'admin'
  },
  {
    email: 'admin2@crediwork.com',
    password: 'Admin456!',
    firstName: 'Operations',
    lastName: 'Manager',
    phone: '+254700000002',
    role: 'admin'
  },
  {
    email: 'admin3@crediwork.com',
    password: 'Admin789!',
    firstName: 'Finance',
    lastName: 'Controller',
    phone: '+254700000003',
    role: 'admin'
  }
];

async function seedAdmins() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crediwork');
    console.log('Connected to database');

    // Remove existing demo admin account
    const demoAdmin = await User.findOneAndDelete({ email: 'admin@crediwork.com' });
    if (demoAdmin) {
      console.log('Removed demo admin account');
    }

    // Remove any existing admin accounts to avoid duplicates
    await User.deleteMany({ role: 'admin' });
    console.log('Removed existing admin accounts');

    // Create new admin users
    for (const adminData of adminUsers) {
      const admin = new User({
        ...adminData,
        status: 'active',
        activationDate: new Date()
      });

      await admin.save();
      console.log(`Created admin: ${adminData.firstName} ${adminData.lastName} (${adminData.email})`);
    }

    console.log('\n✅ Admin seeding completed successfully!');
    console.log('\n📋 Admin Login Credentials:');
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${admin.password}`);
      console.log(`   Phone: ${admin.phone}\n`);
    });

  } catch (error) {
    console.error('Error seeding admins:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedAdmins();
