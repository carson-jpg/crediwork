import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useWalletData } from '../../hooks/useWalletData';
import { PaymentButton } from './PaymentButton';
import {
  Wallet,
  CheckSquare,
  Clock,
  Calendar,
  TrendingUp,
  Star,
  Gift
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, isLoading } = useDashboardData(user);
  const { canWithdraw, daysUntilWithdrawal } = useWalletData(user);

  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('mpesa');
  const [paymentDetails, setPaymentDetails] = React.useState({ mpesaPhone: '', bankAccount: '', bankName: '' });
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }
      const data = await response.json();
      setWithdrawals(data.withdrawals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch withdrawals');
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 300) {
      setError('Minimum withdrawal amount is KES 300');
      return;
    }
    if (!canWithdraw) {
      setError(`Withdrawal available after ${daysUntilWithdrawal} days from activation`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = {
        amount: amountNum,
        paymentMethod,
        paymentDetails: paymentMethod === 'mpesa'
          ? { mpesaPhone: paymentDetails.mpesaPhone }
          : { bankAccount: paymentDetails.bankAccount, bankName: paymentDetails.bankName }
      };
      const response = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit withdrawal request');
      }
      setSuccessMessage('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      setPaymentDetails({ mpesaPhone: '', bankAccount: '', bankName: '' });
      fetchWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-32 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const wallet = dashboardData?.wallet;
  const todaysTasks = dashboardData?.todaysTasks || [];
  const completedToday = dashboardData?.completedToday || 0;
  const recentActivity = dashboardData?.recentActivity || [];

  const quickStats = [
    {
      label: 'Available Balance',
      value: `KES ${wallet?.balance.toLocaleString() || 0}`,
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Tasks Completed Today',
      value: `${completedToday}/${todaysTasks.length}`,
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Daily Earning Rate',
      value: `KES ${user?.dailyEarning || 0}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Days Until Withdrawal',
      value: canWithdraw ? 'Available' : `${daysUntilWithdrawal} days`,
      icon: Calendar,
      color: canWithdraw ? 'text-emerald-600' : 'text-gray-600',
      bgColor: canWithdraw ? 'bg-emerald-50' : 'bg-gray-50',
    },
  ];

  if (user?.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Account Pending Approval</h2>
          <p className="text-yellow-700 mb-6">
            Your registration is under review. Please complete payment for Package {user.package}
            (KES {user.packagePrice.toLocaleString()}) and wait for admin approval.
          </p>
          <PaymentButton packagePrice={user.packagePrice} packageName={user.package || 'Unknown'} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
            <p className="text-blue-100">
              You're on Package {user?.package} - earning KES {user?.dailyEarning} per completed task
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-300" />
            <span className="text-lg font-semibold">Level 1</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h2>
        {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
        {successMessage && <div className="mb-4 text-green-600 font-medium">{successMessage}</div>}
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <input
              type="number"
              id="amount"
              min={300}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {paymentMethod === 'mpesa' && (
            <div>
              <label htmlFor="mpesaPhone" className="block text-sm font-medium text-gray-700">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="mpesaPhone"
                value={paymentDetails.mpesaPhone}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, mpesaPhone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <>
              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  value={paymentDetails.bankAccount}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, bankAccount: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={paymentDetails.bankName}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting || !canWithdraw}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              submitting || !canWithdraw ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
        </div>
        <div className="p-6">
          {loadingWithdrawals ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.slice(0, 5).map((withdrawal: any) => (
                <div key={withdrawal._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      withdrawal.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                      withdrawal.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                      withdrawal.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">KES {withdrawal.amount.toLocaleString()}</h3>
                      <p className="text-sm text-gray-600">
                        {withdrawal.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Transfer'} •
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      withdrawal.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {withdrawals.length > 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Showing 5 of {withdrawals.length} withdrawals
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal History</h3>
              <p className="text-gray-600">Your withdrawal requests will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Tasks Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Today's Tasks</h2>
            <Link 
              to="/tasks"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View All Tasks
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {todaysTasks.length > 0 ? (
            <div className="space-y-4">
              {todaysTasks.slice(0, 2).map((userTask: any) => {
                const task = dashboardData?.todaysTasks.find((t: any) => t._id === userTask.taskId);
                if (!task) return null;

                return (
                  <div key={userTask._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        userTask.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <CheckSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.estimatedTime} min • KES {task.reward}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userTask.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userTask.status === 'completed' ? 'Completed' : 'Available'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Today</h3>
              <p className="text-gray-600">New tasks will be assigned tomorrow at midnight</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-emerald-50">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Task completed</p>
                    <p className="text-xs text-gray-600">
                      Earned KES {activity.reward} • {new Date(activity.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};