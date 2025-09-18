import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testAdminLogin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crediwork');
    console.log('Connected to database');

    // Test admin login
    const response = await fetch('https://crediwork.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin1@crediwork.com',
        password: 'Admin123!',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Login failed:', data.error);
      return;
    }

    console.log('Login successful!');
    console.log('User:', data.user);
    console.log('Token:', data.token);

    // Test token validation
    const validateResponse = await fetch('https://crediwork.onrender.com/api/auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    const validateData = await validateResponse.json();

    if (!validateResponse.ok) {
      console.error('Token validation failed:', validateData.error);
      return;
    }

    console.log('Token validation successful!');
    console.log('Validated user:', validateData.user);

    // Test admin dashboard data
    const dashboardResponse = await fetch('https://crediwork.onrender.com/api/admin/users/count', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    const dashboardData = await dashboardResponse.json();

    if (!dashboardResponse.ok) {
      console.error('Admin dashboard access failed:', dashboardData.error);
      return;
    }

    console.log('Admin dashboard access successful!');
    console.log('User count:', dashboardData.count);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

testAdminLogin();
