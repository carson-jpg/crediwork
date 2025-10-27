import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useWalletData } from '../../hooks/useWalletData';
import { PaymentButton } from './PaymentButton';
import { Task, UserTask } from '../../types';
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="bg-gray-200 h-8 w-80 rounded-lg"></div>
                  <div className="bg-gray-200 h-5 w-96 rounded-lg"></div>
                </div>
                <div className="bg-gray-200 h-12 w-24 rounded-full"></div>
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 h-12 w-12 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-200 h-4 w-20 rounded"></div>
                      <div className="bg-gray-200 h-6 w-16 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-12 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md mx-auto p-6 pt-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Approval</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your registration is under review. Please complete payment for Package {user.package}
              (KES {user.packagePrice.toLocaleString()}) and wait for admin approval.
            </p>
            <div className="space-y-4">
              <PaymentButton packagePrice={user.packagePrice} packageName={user.package || 'Unknown'} />
              <p className="text-sm text-gray-500">
                Need help? Contact our support team
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName} {user?.lastName}!</h1>
              <p className="text-blue-100 text-lg">
                Package {user?.package} • Earning KES {user?.dailyEarning} per task
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Star className="h-5 w-5 text-yellow-300 fill-current" />
              <span className="text-lg font-semibold">Level 1</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group">
              <div className="flex items-center">
                <div className={`p-4 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Tasks Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
              <Link
                to="/tasks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                View All Tasks
              </Link>
            </div>
          </div>

          <div className="p-6">
            {todaysTasks.length > 0 ? (
              <div className="space-y-4">
                {todaysTasks.slice(0, 2).map((item: { task: Task; userTask: UserTask }) => {
                  const { task, userTask } = item;

                  return (
                    <div key={userTask._id} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${
                          userTask.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <CheckSquare className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                          <p className="text-sm text-gray-600">{task.estimatedTime} min • KES {task.reward}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Tasks Today</h3>
                <p className="text-gray-600 max-w-md mx-auto">New tasks will be assigned tomorrow at midnight. Check back later!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900">Task completed</p>
                      <p className="text-sm text-gray-600">
                        Earned KES {activity.reward} • {new Date(activity.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">No Recent Activity</h3>
                <p className="text-gray-600 max-w-md mx-auto">Complete your first task to see your activity history here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};