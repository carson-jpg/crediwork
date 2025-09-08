import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import User from './models/User.js';
import Task from './models/Task.js';
import UserTask from './models/UserTask.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

async function assignTasksToUser(userEmail) {
  try {
    console.log(`Assigning tasks to user: ${userEmail}`);

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (ID: ${user._id})`);

    // Get all active tasks
    const tasks = await Task.find({ isActive: true });
    console.log(`Found ${tasks.length} active tasks`);

    if (tasks.length === 0) {
      console.log('No active tasks found in database');
      return;
    }

    // Check which tasks are already assigned to this user
    const existingAssignments = await UserTask.find({
      userId: user._id,
      taskId: { $in: tasks.map(t => t._id) }
    });

    const assignedTaskIds = existingAssignments.map(ua => ua.taskId.toString());
    const unassignedTasks = tasks.filter(task => !assignedTaskIds.includes(task._id.toString()));

    console.log(`User already has ${existingAssignments.length} task assignments`);
    console.log(`${unassignedTasks.length} tasks need to be assigned`);

    if (unassignedTasks.length === 0) {
      console.log('All tasks are already assigned to this user');
      return;
    }

    // Assign unassigned tasks to the user
    const assignedDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days due date

    const userTaskAssignments = unassignedTasks.map(task => ({
      userId: user._id,
      taskId: task._id,
      assignedDate,
      dueDate,
      status: 'assigned'
    }));

    await UserTask.insertMany(userTaskAssignments);

    console.log(`Successfully assigned ${unassignedTasks.length} tasks to user ${userEmail}`);
    console.log('Task titles:', unassignedTasks.map(t => t.title));

  } catch (error) {
    console.error('Error assigning tasks:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get email from command line argument or use default
const userEmail = process.argv[2] || 'isavameshack@gmail.com';
assignTasksToUser(userEmail);
