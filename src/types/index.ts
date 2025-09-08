export interface User {
  _id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'user' | 'admin';
  package: 'A' | 'B' | null;
  packagePrice: number;
  dailyEarning: number;
  status: 'pending' | 'active' | 'suspended';
  activationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: 'text' | 'link' | 'file';
  reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  instructions: string;
  validationRules?: {
    minLength?: number;
    requiredKeywords?: string[];
    urlPattern?: string;
  };
  createdAt: Date;
  isActive: boolean;
}

export interface TaskSubmission {
  _id: string;
  userId: string;
  taskId: string;
  submissionType: 'text' | 'link' | 'file';
  content: string;
  proof?: string; // file URL or additional proof
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  earnedAmount: number;
}

export interface UserTask {
  _id: string;
  userId: string;
  taskId: string;
  assignedDate: Date;
  dueDate: Date;
  status: 'assigned' | 'completed' | 'expired';
  submissionId?: string;
}

export interface Wallet {
  _id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastUpdated: Date;
}

export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  method: 'mpesa' | 'bank';
  accountDetails: {
    phoneNumber?: string;
    accountNumber?: string;
    bankName?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  rejectionReason?: string;
  payoutReference?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  dailyActiveUsers: number;
  totalEarningsAccrued: number;
  pendingWithdrawals: number;
  approvedToday: number;
  taskCompletionRate: number;
}