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