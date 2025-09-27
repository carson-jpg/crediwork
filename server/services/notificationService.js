import Notification from '../models/Notification.js';

// Create a new notification
export const createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedId'),
      Notification.countDocuments({ userId })
    ]);

    return {
      notifications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

// Get unread notification count for a user
export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ userId, isRead: false });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get all notifications for admin (with pagination and filters)
export const getAllNotifications = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (filters.type) query.type = filters.type;
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.userId) query.userId = filters.userId;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'firstName lastName email'),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
};

// Create notification for multiple users (broadcast)
export const createBulkNotifications = async (userIds, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    }));

    const createdNotifications = await Notification.insertMany(notifications);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};
