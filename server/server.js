// Additional dependencies for M-Pesa STK Push
import axios from 'axios';
import moment from 'moment';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import cron from 'node-cron';

// Import models
import User from './models/User.js';
import Task from './models/Task.js';
import UserTask from './models/UserTask.js';
import TaskSubmission from './models/TaskSubmission.js';
import Payment from './models/Payment.js';
import Wallet from './models/Wallet.js';
import Withdrawal from './models/Withdrawal.js';

// Import services
import { sendPaymentSuccessEmail, sendPaymentFailedEmail, sendWithdrawalSubmittedEmail, sendWithdrawalApprovedEmail, sendWithdrawalRejectedEmail } from './services/emailService.js';
import { initiateSTKPush } from './services/mpesaService.js';
import { getAllSettings, getSettingsByCategory, createSetting, updateSetting, deleteSetting } from './services/settingsService.js';
import { createNotification, getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createBulkNotifications, getAllNotifications } from './services/notificationService.js';

// Import middleware
import { authenticateToken, requireAdmin, requireActiveUser } from './middleware/auth.js';

// Initialize dotenv
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://crediwork.vercel.app',
    'https://crediwork.onrender.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crediwork')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Additional STK Push endpoint (standalone)
app.post('/stkpush', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required' });
  }

  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    const accessToken = tokenResponse.data.access_token;

    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: 'https://your-callback-url.com/callback', // Replace with your actual callback URL
      AccountReference: 'M-Pesa STK Push',
      TransactionDesc: 'Payment for goods'
    };

    const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPushData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error initiating STK push:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to initiate STK push' });
  }
});

// User dashboard endpoints
app.get('/api/dashboard', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user wallet
    const wallet = await Wallet.findOne({ userId }).select('balance totalEarned totalWithdrawn lastUpdated');

    // Get user's tasks for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userTasks = await UserTask.find({
      userId,
      assignedDate: { $gte: today, $lt: tomorrow }
    }).populate('taskId').select('taskId status assignedDate dueDate');

    // Get completed tasks count for today
    const completedToday = await UserTask.countDocuments({
      userId,
      status: 'completed',
      assignedDate: { $gte: today, $lt: tomorrow }
    });

    // Get recent activity (last 5 completed task submissions)
    const recentActivity = await TaskSubmission.find({
      userId,
      status: 'completed'
    }).populate('taskId', 'title reward')
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('taskId updatedAt');

    res.json({
      wallet: wallet || { balance: 0, totalEarned: 0, totalWithdrawn: 0, lastUpdated: new Date() },
      todaysTasks: userTasks,
      completedToday,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// User dashboard endpoint (alternative path)
app.get('/api/user/dashboard', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user wallet
    const wallet = await Wallet.findOne({ userId }).select('balance totalEarned totalWithdrawn lastUpdated');

    // Get user's tasks for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userTasks = await UserTask.find({
      userId,
      assignedDate: { $gte: today, $lt: tomorrow }
    }).populate('taskId').select('taskId status assignedDate dueDate');

    // Get completed tasks count for today
    const completedToday = await UserTask.countDocuments({
      userId,
      status: 'completed',
      assignedDate: { $gte: today, $lt: tomorrow }
    });

    // Get recent activity (last 5 completed task submissions)
    const recentActivity = await TaskSubmission.find({
      userId,
      status: 'completed'
    }).populate('taskId', 'title reward')
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('taskId updatedAt');

    res.json({
      wallet: wallet || { balance: 0, totalEarned: 0, totalWithdrawn: 0, lastUpdated: new Date() },
      todaysTasks: userTasks,
      completedToday,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.get('/api/user/wallet', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = new Wallet({ userId });
      await newWallet.save();
      return res.json({
        _id: newWallet._id,
        userId: newWallet.userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastUpdated: newWallet.lastUpdated
      });
    }

    res.json({
      _id: wallet._id,
      userId: wallet.userId,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      lastUpdated: wallet.lastUpdated
    });
  } catch (error) {
    console.error('Wallet data error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

app.get('/api/user/tasks', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user to check package
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter tasks based on package
    const rewardFilter = user.package === 'A' ? 50 : 100;

    // Get user's assigned tasks with reward filtering
    const userTasks = await UserTask.find({ userId })
      .populate({
        path: 'taskId',
        match: { reward: rewardFilter }
      })
      .sort({ assignedDate: -1 })
      .select('taskId status assignedDate dueDate submissionId');

    // Filter out null taskId (tasks that don't match the reward filter)
    const filteredUserTasks = userTasks.filter(ut => ut.taskId !== null);

    // Get task submissions with reward filtering
    const submissions = await TaskSubmission.find({ userId })
      .populate({
        path: 'taskId',
        match: { reward: rewardFilter },
        select: 'title'
      })
      .sort({ submittedAt: -1 })
      .select('taskId status submittedAt earnedAmount');

    // Filter out null taskId from submissions
    const filteredSubmissions = submissions.filter(sub => sub.taskId !== null);

    res.json({
      userTasks: filteredUserTasks,
      submissions: filteredSubmissions
    });
  } catch (error) {
    console.error('Tasks data error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks data' });
  }
});

app.post('/api/user/tasks/:taskId/submit', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, proof } = req.body;
    const userId = req.user._id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has this task assigned
    const userTask = await UserTask.findOne({ userId, taskId, status: 'assigned' });
    if (!userTask) {
      return res.status(400).json({ error: 'Task not assigned to user' });
    }

    // Create submission
    const submission = new TaskSubmission({
      userId,
      taskId,
      content,
      proof,
      status: 'pending'
    });
    await submission.save();

    // Update user task status
    userTask.status = 'submitted';
    userTask.submissionId = submission._id;
    await userTask.save();

    // Add provisional reward to user's wallet balance
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ 
        userId, 
        balance: task.reward, 
        totalEarned: 0, 
        totalWithdrawn: 0 
      });
      await wallet.save();
    } else {
      wallet.balance += task.reward;
      await wallet.save();
    }

    // Note: Reward added provisionally to balance; will be deducted if rejected, totalEarned updated if approved

    res.json({
      message: 'Task submitted successfully',
      submission: {
        _id: submission._id,
        status: submission.status,
        earnedAmount: task.reward
      }
    });
  } catch (error) {
    console.error('Task submission error:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

// User withdrawal endpoints
app.post('/api/withdrawals', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user._id;

    // Get user and wallet data
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId });

    if (!user || !wallet) {
      return res.status(404).json({ error: 'User or wallet not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(400).json({ error: 'Account must be active to withdraw' });
    }

    // Check withdrawal eligibility (10 days after activation)
    const daysSinceActivation = Math.floor(
      (new Date().getTime() - new Date(user.activationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivation < 10) {
      return res.status(400).json({ error: 'Withdrawal available after 10 days from activation' });
    }

    // Check minimum withdrawal amount based on package
    const minAmount = user.package === 'A' ? 500 : 1000;
    if (amount < minAmount) {
      return res.status(400).json({ error: `Minimum withdrawal amount is KES ${minAmount}` });
    }

    // Check if user has sufficient balance
    if (amount > wallet.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({
      userId,
      status: { $in: ['pending', 'processing'] }
    });
    if (pendingWithdrawals > 0) {
      return res.status(400).json({ error: 'You have a pending withdrawal request' });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      amount,
      paymentMethod,
      paymentDetails
    });

    await withdrawal.save();

    // Update wallet (deduct from balance for pending withdrawal)
    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    await wallet.save();

    // Send withdrawal submitted email notification
    try {
      await sendWithdrawalSubmittedEmail(user.email, user.firstName, amount, paymentMethod);
    } catch (emailError) {
      console.error('Failed to send withdrawal submitted email:', emailError);
    }

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Withdrawal creation error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

// User withdrawal endpoint (alternative path)
app.post('/api/user/withdrawals', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user._id;

    // Get user and wallet data
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId });

    if (!user || !wallet) {
      return res.status(404).json({ error: 'User or wallet not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(400).json({ error: 'Account must be active to withdraw' });
    }

    // Check withdrawal eligibility (10 days after activation)
    const daysSinceActivation = Math.floor(
      (new Date().getTime() - new Date(user.activationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivation < 10) {
      return res.status(400).json({ error: 'Withdrawal available after 10 days from activation' });
    }

    // Check minimum withdrawal amount based on package
    const minAmount = user.package === 'A' ? 500 : 1000;
    if (amount < minAmount) {
      return res.status(400).json({ error: `Minimum withdrawal amount is KES ${minAmount}` });
    }

    // Check if user has sufficient balance
    if (amount > wallet.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({
      userId,
      status: { $in: ['pending', 'processing'] }
    });
    if (pendingWithdrawals > 0) {
      return res.status(400).json({ error: 'You have a pending withdrawal request' });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      amount,
      paymentMethod,
      paymentDetails
    });

    await withdrawal.save();

    // Update wallet (deduct from balance for pending withdrawal)
    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    await wallet.save();

    // Send withdrawal submitted email notification
    try {
      await sendWithdrawalSubmittedEmail(user.email, user.firstName, amount, paymentMethod);
    } catch (emailError) {
      console.error('Failed to send withdrawal submitted email:', emailError);
    }

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Withdrawal creation error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

app.get('/api/withdrawals', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('amount status paymentMethod paymentDetails adminNotes payoutReference processedAt createdAt'),
      Withdrawal.countDocuments({ userId })
    ]);

    res.json({
      withdrawals,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Fetch withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// User withdrawal history endpoint (alternative path)
app.get('/api/user/withdrawals', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('amount status paymentMethod paymentDetails adminNotes payoutReference processedAt createdAt'),
      Withdrawal.countDocuments({ userId })
    ]);

    res.json({
      withdrawals,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Fetch user withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// Admin routes
app.get('/api/admin/users/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

app.get('/api/admin/users/active/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments({ status: 'active' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active user count' });
  }
});

app.get('/api/admin/withdrawals/pending/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await Withdrawal.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending withdrawals count' });
  }
});

app.get('/api/admin/withdrawals/approved/today/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Withdrawal.countDocuments({
      status: 'approved',
      processedAt: { $gte: today, $lt: tomorrow }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approved today count' });
  }
});

app.get('/api/admin/users/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email firstName lastName package status createdAt');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent users' });
  }
});

// Get daily active users count
app.get('/api/admin/users/daily-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await User.countDocuments({
      lastLogin: { $gte: today, $lt: tomorrow }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily active users' });
  }
});

// Get total earnings accrued
app.get('/api/admin/earnings/total', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $match: { role: 'user' }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$packageAmount' }
        }
      }
    ]);

    const totalEarnings = result.length > 0 ? result[0].totalEarnings : 0;
    res.json({ totalEarnings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch total earnings' });
  }
});

// Get task completion rate
app.get('/api/admin/tasks/completion-rate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalTasks = await UserTask.countDocuments();
    const completedTasks = await UserTask.countDocuments({ status: 'completed' });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    res.json({ completionRate: Math.round(completionRate * 100) / 100 });
  } catch (error) {
    console.error('Task completion rate error:', error);
    res.status(500).json({ error: 'Failed to fetch task completion rate' });
  }
});

// Get disputes count
app.get('/api/admin/disputes/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await UserTask.countDocuments({ status: 'rejected' });
    res.json({ count });
  } catch (error) {
    console.error('Disputes count error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes count' });
  }
});

// Get quick actions counts
app.get('/api/admin/quick-actions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pendingUsers, pendingWithdrawals, pendingTasks] = await Promise.all([
      User.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      UserTask.countDocuments({ status: 'submitted' })
    ]);

    res.json({
      pendingApprovals: pendingUsers,
      pendingWithdrawals,
      pendingReviews: pendingTasks
    });
  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({ error: 'Failed to fetch quick actions data' });
  }
});

// Get all users with filtering and pagination
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('firstName lastName email phone package packageAmount status totalEarned activationDate createdAt'),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get detailed user information by ID
app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's wallet information
    const wallet = await Wallet.findOne({ userId }).select('balance totalEarned totalWithdrawn lastUpdated');

    // Get user's task statistics
    const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
      UserTask.countDocuments({ userId }),
      UserTask.countDocuments({ userId, status: 'completed' }),
      UserTask.countDocuments({ userId, status: 'assigned' })
    ]);

    // Get recent task submissions (last 5)
    const recentSubmissions = await TaskSubmission.find({ userId })
      .populate('taskId', 'title reward')
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('taskId status submittedAt earnedAmount');

    // Get recent withdrawals (last 5)
    const recentWithdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amount status paymentMethod createdAt processedAt');

    // Get recent payments (last 5)
    const recentPayments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amount status mpesaReceiptNumber transactionDate');

    // Calculate success rate
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        package: user.package,
        packageAmount: user.packageAmount,
        dailyEarning: user.dailyEarning,
        status: user.status,
        activationDate: user.activationDate,
        paymentProof: user.paymentProof,
        kycData: user.kycData,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        lastLogin: user.lastLogin,
        deviceFingerprint: user.deviceFingerprint,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      wallet: wallet || {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        lastUpdated: new Date()
      },
      statistics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        successRate: Math.round(successRate * 100) / 100
      },
      recentActivity: {
        submissions: recentSubmissions,
        withdrawals: recentWithdrawals,
        payments: recentPayments
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Send custom email to user
app.post('/api/admin/users/:userId/send-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, message, template } = req.body;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Import sendEmail function
    const { sendEmail } = await import('./services/emailService.js');

    // Send custom email
    const emailResult = await sendEmail(
      user.email,
      subject,
      template || 'custom-email', // Use custom template or default
      {
        userName: `${user.firstName} ${user.lastName}`,
        message,
        adminName: req.user.firstName + ' ' + req.user.lastName,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@crediwork.com',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
      }
    );

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send email', details: emailResult.error });
    }

    res.json({
      message: 'Email sent successfully',
      messageId: emailResult.messageId,
      recipient: user.email
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get all withdrawals with filtering and pagination
app.get('/api/admin/withdrawals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Withdrawal.countDocuments(query)
    ]);

    res.json({
      withdrawals,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Update withdrawal status
app.put('/api/admin/withdrawals/:withdrawalId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, payoutReference, adminNotes } = req.body;

    const updateData = {
      status,
      processedBy: req.user._id,
      processedAt: new Date()
    };

    if (payoutReference) updateData.payoutReference = payoutReference;
    if (adminNotes) updateData.adminNotes = adminNotes;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      withdrawalId,
      updateData,
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Send email notifications based on status
    try {
      if (status === 'approved') {
        await sendWithdrawalApprovedEmail(withdrawal.userId.email, withdrawal.userId.firstName, withdrawal.amount, withdrawal.paymentMethod, payoutReference);
      } else if (status === 'rejected') {
        await sendWithdrawalRejectedEmail(withdrawal.userId.email, withdrawal.userId.firstName, withdrawal.amount, adminNotes || 'Withdrawal rejected');
      }
    } catch (emailError) {
      console.error('Failed to send withdrawal status email:', emailError);
    }

    res.json({
      message: 'Withdrawal updated successfully',
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal update error:', error);
    res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

app.get('/api/admin/users/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .select('email firstName lastName phone package packageAmount createdAt');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

app.put('/api/admin/users/:userId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: 'active',
        activationDate: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User approved successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        activationDate: user.activationDate
      }
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.put('/api/admin/users/:userId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User rejected successfully',
      user: {
        _id: user._id,
        email: user.email,
        status: user.status,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Task Management Endpoints

// Create a new task
app.post('/api/admin/tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, requiredProofType, instructions, estimatedTime, reward, difficulty } = req.body;

    const newTask = new Task({
      title,
      description,
      category,
      requiredProofType,
      instructions,
      estimatedTime,
      reward,
      difficulty,
      createdBy: req.user._id
    });

    await newTask.save();

    // Automatically assign task to all active users based on their package
    try {
      const activeUsers = await User.find({ status: 'active' }).select('_id package');
      const packageAUsers = activeUsers.filter(user => user.package === 'A').map(user => user._id);
      const packageBUsers = activeUsers.filter(user => user.package === 'B').map(user => user._id);

      // Assign to Package A users if reward is 50, Package B users if reward is 100
      let targetUsers = [];
      if (newTask.reward === 50) {
        targetUsers = packageAUsers;
      } else if (newTask.reward === 100) {
        targetUsers = packageBUsers;
      } else {
        // If reward doesn't match expected values, assign to all users
        targetUsers = activeUsers.map(user => user._id);
      }

      if (targetUsers.length > 0) {
        const assignedDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Default 7 days due date

        const userTasks = targetUsers.map(userId => ({
          userId,
          taskId: newTask._id,
          assignedDate,
          dueDate,
          status: 'assigned'
        }));

        await UserTask.insertMany(userTasks);
        console.log(`Task automatically assigned to ${targetUsers.length} active users based on package`);
      }
    } catch (assignmentError) {
      console.error('Error auto-assigning task:', assignmentError);
      // Don't fail the task creation if assignment fails
    }

    res.status(201).json({
      message: 'Task created and assigned to all active users successfully',
      task: newTask
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get a specific task by ID
app.get('/api/admin/tasks/:taskId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Fetch task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Get all tasks with filtering and pagination
app.get('/api/admin/tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query)
    ]);

    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update a task
app.put('/api/admin/tasks/:taskId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    const task = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/admin/tasks/:taskId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Also delete all user tasks associated with this task
    await UserTask.deleteMany({ taskId });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Assign task to users
app.post('/api/admin/tasks/:taskId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userIds, dueDate } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const assignedDate = new Date();
    const dueDateObj = new Date(dueDate);

    const userTasks = userIds.map(userId => ({
      userId,
      taskId,
      assignedDate,
      dueDate: dueDateObj,
      status: 'assigned'
    }));

    await UserTask.insertMany(userTasks);

    res.json({
      message: `Task assigned to ${userIds.length} users successfully`
    });
  } catch (error) {
    console.error('Task assignment error:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Get task submissions for review
app.get('/api/admin/task-submissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { status: 'pending' }; // Only show pending submissions for review
    if (status && status !== 'all') {
      query.status = status;
    }

    const [rawSubmissions, total] = await Promise.all([
      TaskSubmission.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('taskId', 'title description reward requiredProofType')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TaskSubmission.countDocuments(query)
    ]);

    // Transform submissions to match frontend expectations
    const submissions = rawSubmissions.map(submission => ({
      _id: submission._id,
      userId: submission.userId,
      taskId: submission.taskId,
      submissionData: {
        proofText: submission.content,
        proofLink: submission.proof,
        proofFile: submission.proof,
        submittedAt: submission.submittedAt
      },
      status: submission.status,
      reviewData: submission.reviewData
    }));

    res.json({
      submissions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch task submissions' });
  }
});

// Approve or reject task submission
app.put('/api/admin/task-submissions/:submissionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    const updateData = {
      reviewData: {
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      }
    };

    if (action === 'approve') {
      updateData.status = 'completed';
      const submission = await TaskSubmission.findById(submissionId).populate('taskId');
      if (submission) {
        const wallet = await Wallet.findOne({ userId: submission.userId });
        if (wallet) {
          wallet.totalEarned += submission.taskId.reward;
          await wallet.save();
        }
        // Update UserTask status to completed
        await UserTask.findOneAndUpdate(
          { userId: submission.userId, submissionId: submissionId },
          { status: 'completed' }
        );
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.reviewData.rejectionReason = rejectionReason;
      const submission = await TaskSubmission.findById(submissionId).populate('taskId');
      if (submission) {
        console.log(`Rejecting submission ${submissionId}, user ${submission.userId}, reward ${submission.taskId.reward}`);
        const wallet = await Wallet.findOne({ userId: submission.userId });
        if (wallet) {
          console.log(`Current balance: ${wallet.balance}`);
          wallet.balance = Math.max(0, wallet.balance - submission.taskId.reward);
          console.log(`New balance: ${wallet.balance}`);
          await wallet.save();
          console.log('Wallet saved');
        } else {
          console.log('Wallet not found for user', submission.userId);
        }
        await UserTask.findOneAndUpdate(
          { userId: submission.userId, submissionId: submissionId },
          { status: 'rejected' }
        );
      } else {
        console.log('Submission not found', submissionId);
      }
    }

    const submission = await TaskSubmission.findByIdAndUpdate(submissionId, updateData, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('taskId', 'title reward');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      message: `Task submission ${action}d successfully`,
      submission
    });
  } catch (error) {
    console.error('Submission review error:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

// Settings Management Endpoints

// Get all settings
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    let settings;
    if (category && category !== 'all') {
      settings = await getSettingsByCategory(category);
    } else {
      settings = await getAllSettings();
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
});

// Create new setting
app.post('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key || !value || !category) {
      return res.status(400).json({ error: 'Key, value, and category are required' });
    }

    const newSetting = await createSetting({ key, value, description, category });
    res.status(201).json({
      message: 'Setting created successfully',
      setting: newSetting
    });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to create setting' });
  }
});

// Update setting
app.put('/api/admin/settings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, description, category } = req.body;

    const updatedSetting = await updateSetting(id, { key, value, description, category });
    res.json({
      message: 'Setting updated successfully',
      setting: updatedSetting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to update setting' });
  }
});

// Delete setting
app.delete('/api/admin/settings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSetting = await deleteSetting(id);
    res.json({
      message: 'Setting deleted successfully',
      setting: deletedSetting
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete setting' });
  }
});

// Notification Management Endpoints

// Get user notifications
app.get('/api/user/notifications', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await getUserNotifications(userId, parseInt(limit), skip);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Get unread notification count
app.get('/api/user/notifications/unread-count', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch unread count' });
  }
});

// Mark notification as read
app.put('/api/user/notifications/:notificationId/read', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await markAsRead(notificationId, userId);
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/user/notifications/mark-all-read', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await markAllAsRead(userId);
    res.json(result);
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
  }
});

// Delete notification
app.delete('/api/user/notifications/:notificationId', authenticateToken, requireActiveUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const result = await deleteNotification(notificationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

// Admin: Create notification
app.post('/api/admin/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, type, userIds, sendToAll } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ error: 'Title, message, and type are required' });
    }

    if (!sendToAll && (!userIds || userIds.length === 0)) {
      return res.status(400).json({ error: 'Either sendToAll must be true or userIds must be provided' });
    }

    const notificationData = {
      title,
      message,
      type,
      createdBy: req.user._id
    };

    let result;
    if (sendToAll) {
      result = await createBulkNotifications(notificationData, null);
    } else {
      result = await createBulkNotifications(notificationData, userIds);
    }

    res.status(201).json({
      message: 'Notifications created successfully',
      ...result
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: error.message || 'Failed to create notification' });
  }
});

// Admin: Get all notifications
app.get('/api/admin/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isRead, userId } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (userId) filters.userId = userId;

    const result = await getAllNotifications(parseInt(page), parseInt(limit), filters);

    res.json(result);
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Test callback URL endpoint
app.get('/api/payment/test-callback-url', (req, res) => {
  res.json({
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    environment: process.env.MPESA_ENV,
    timestamp: new Date().toISOString()
  });
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName, package: userPackage } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or phone' });
    }

    // Determine role
    const isAdmin = email.endsWith('@admin.com');
    const role = isAdmin ? 'admin' : 'user';

    // Prepare user data
    const userData = {
      email,
      password,
      phone,
      firstName,
      lastName,
      role
    };

    // Only set package-related fields for regular users
    if (!isAdmin) {
      if (!userPackage) {
        return res.status(400).json({ error: 'Package is required for user registration' });
      }
      userData.package = userPackage;
      userData.packageAmount = userPackage === 'A' ? 1000 : 2000;
      userData.dailyEarning = userPackage === 'A' ? 50 : 100;
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        package: newUser.package,
        status: newUser.status
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Token validation endpoint
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role,
        package: req.user.package,
        status: req.user.status,
        activationDate: req.user.activationDate,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        package: user.package,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Payment endpoints
app.post('/api/payment/stkpush', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount are required' });
    }

    // Check if user exists and is pending
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ error: 'Payment only required for pending users' });
    }

    // Check if amount matches package price
    if (amount !== user.packageAmount) {
      return res.status(400).json({ error: 'Payment amount does not match package price' });
    }

    // Initiate STK push
    const stkPushResult = await initiateSTKPush(
      phoneNumber,
      amount,
      `User-${userId}`, // accountReference
      `Payment for ${user.package} package` // transactionDesc
    );

    if (!stkPushResult.success) {
      // If token error, clear token cache and retry once
      if (stkPushResult.error && stkPushResult.error.includes('Invalid or expired token')) {
        // Clear cached token
        const mpesaService = require('./services/mpesaService.js');
        mpesaService.accessToken = null;
        mpesaService.tokenExpiry = null;

        // Retry STK push
        const retryResult = await initiateSTKPush(
          phoneNumber,
          amount,
          `User-${userId}`,
          `Payment for ${user.package} package`
        );

        if (!retryResult.success) {
          return res.status(500).json({ error: retryResult.error || 'Failed to initiate payment after retry' });
        }

        // Use retry result
        stkPushResult.transactionId = retryResult.transactionId;
      } else {
        return res.status(500).json({ error: stkPushResult.error || 'Failed to initiate payment' });
      }
    }

    // Create payment record
    const payment = new Payment({
      userId,
      amount,
      phoneNumber,
      mpesaTransactionId: stkPushResult.transactionId,
      status: 'pending'
    });

    await payment.save();

    res.json({
      message: 'Payment request sent successfully',
      transactionId: stkPushResult.transactionId,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('STK push error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// M-Pesa callback endpoint
app.post('/api/payment/stkpush/callback', async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // For testing purposes, accept any JSON payload
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Accepting test callback payload');
      return res.json({
        message: 'Test callback processed successfully',
        receivedData: callbackData
      });
    }

    // Production validation
    const { Body } = callbackData;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }

    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find payment by transaction ID
    const payment = await Payment.findOne({ mpesaTransactionId: CheckoutRequestID });
    if (!payment) {
      console.log('Payment not found for transaction ID:', CheckoutRequestID);
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (ResultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      payment.mpesaReceiptNumber = CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      payment.transactionDate = new Date();

      // Update user status to active
      await User.findByIdAndUpdate(payment.userId, {
        status: 'active',
        activationDate: new Date()
      });

      // Send payment success email notification
      try {
        await sendPaymentSuccessEmail(payment.userId, payment.amount);
      } catch (emailError) {
        console.error('Failed to send payment success email:', emailError);
      }

      console.log('Payment completed successfully for user:', payment.userId);
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = ResultDesc;

      // Send payment failure email notification
      try {
        await sendPaymentFailedEmail(payment.userId, ResultDesc);
      } catch (emailError) {
        console.error('Failed to send payment failure email:', emailError);
      }

      console.log('Payment failed for user:', payment.userId, 'Reason:', ResultDesc);
    }

    await payment.save();

    res.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
});

// Get payment status
app.get('/api/payment/status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.mpesaTransactionId,
      receiptNumber: payment.mpesaReceiptNumber,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
