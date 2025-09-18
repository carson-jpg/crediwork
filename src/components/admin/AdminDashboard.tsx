import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [dailyActiveCount, setDailyActiveCount] = useState<number | null>(null);
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [taskCompletionRate, setTaskCompletionRate] = useState<number | null>(null);
  const [disputesCount, setDisputesCount] = useState<number | null>(null);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState<number | null>(null);
  const [approvedTodayCount, setApprovedTodayCount] = useState<number | null>(null);
  const [quickActionsData, setQuickActionsData] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    userTrend: [] as any[],
    earningsByPackage: [] as any[],
    taskCompletion: [] as any[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log('Fetching dashboard data with token:', !!token);

        const [
          usersRes,
          activeUsersRes,
          dailyActiveRes,
          earningsRes,
          completionRateRes,
          disputesRes,
          pendingWithdrawalsRes,
          approvedTodayRes,
          quickActionsRes,
          recentUsersRes
        ] = await Promise.all([
          axios.get(`${baseURL}/api/admin/users/count`, { headers }),
          axios.get(`${baseURL}/api/admin/users/active/count`, { headers }),
          axios.get(`${baseURL}/api/admin/users/daily-active`, { headers }),
          axios.get(`${baseURL}/api/admin/earnings/total`, { headers }),
          axios.get(`${baseURL}/api/admin/tasks/completion-rate`, { headers }),
          axios.get(`${baseURL}/api/admin/disputes/count`, { headers }),
          axios.get(`${baseURL}/api/admin/withdrawals/pending/count`, { headers }),
          axios.get(`${baseURL}/api/admin/withdrawals/approved/today/count`, { headers }),
          axios.get(`${baseURL}/api/admin/quick-actions`, { headers }),
          axios.get(`${baseURL}/api/admin/users/recent`, { headers })
        ]);

        console.log('API responses:', {
          usersRes: usersRes.data,
          activeUsersRes: activeUsersRes.data,
          quickActionsRes: quickActionsRes.data,
          recentUsersRes: recentUsersRes.data
        });

        setUsersCount(usersRes.data.count);
        setActiveUsersCount(activeUsersRes.data.count);
        setDailyActiveCount(dailyActiveRes.data.count);
        setTotalEarnings(earningsRes.data.totalEarnings);
        setTaskCompletionRate(completionRateRes.data.completionRate);
        setDisputesCount(disputesRes.data.count);
        setPendingWithdrawalsCount(pendingWithdrawalsRes.data.count);
        setApprovedTodayCount(approvedTodayRes.data.count);
        setQuickActionsData(quickActionsRes.data);
        setRecentUsers(recentUsersRes.data.users);

        // Set chart data
        setChartData({
          userTrend: [
            { date: '2024-01', users: 10 },
            { date: '2024-02', users: 25 },
            { date: '2024-03', users: 40 },
            { date: '2024-04', users: 60 },
            { date: '2024-05', users: 85 },
            { date: '2024-06', users: usersCount || 100 }
          ],
          earningsByPackage: [
            { package: 'Package 1', earnings: 50000 },
            { package: 'Package 2', earnings: 75000 },
            { package: 'Package 3', earnings: 100000 },
            { package: 'Package 4', earnings: 125000 }
          ],
          taskCompletion: [
            { name: 'Completed', value: taskCompletionRate || 75 },
            { name: 'Pending', value: 100 - (taskCompletionRate || 75) }
          ]
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          console.error('Authorization error: 403 Forbidden. Token may be invalid or expired.');
          // Optionally, trigger logout or token refresh here
        } else {
          console.error('Error fetching dashboard data:', error);
        }
        // Set default values if API fails
        setUsersCount(0);
        setActiveUsersCount(0);
        setDailyActiveCount(0);
        setTotalEarnings(0);
        setTaskCompletionRate(0);
        setDisputesCount(0);
        setPendingWithdrawalsCount(0);
        setApprovedTodayCount(0);
        setQuickActionsData({ pendingApprovals: 0, pendingWithdrawals: 0, pendingReviews: 0 });
        setRecentUsers([]);
        setChartData({
          userTrend: [],
          earningsByPackage: [],
          taskCompletion: []
        });
      } finally {
        setLoading(false);
      }
      };

    fetchDashboardData();
  }, []);

  const dashboardStats = [
    {
      label: 'Total Users',
      value: usersCount != null ? usersCount.toLocaleString() : 'Loading...',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Users',
      value: activeUsersCount != null ? activeUsersCount.toLocaleString() : 'Loading...',
      change: '+8%',
      changeType: 'increase',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Daily Active',
      value: dailyActiveCount != null ? dailyActiveCount.toLocaleString() : 'Loading...',
      change: '+15%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Total Earnings Accrued',
      value: totalEarnings != null ? `KES ${(totalEarnings / 1000).toFixed(1)}K` : 'Loading...',
      change: '+22%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Pending Withdrawals',
      value: pendingWithdrawalsCount != null ? pendingWithdrawalsCount.toLocaleString() : 'Loading...',
      change: '+5%',
      changeType: 'increase',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Approved Today',
      value: approvedTodayCount != null ? approvedTodayCount.toLocaleString() : 'Loading...',
      change: '-3%',
      changeType: 'decrease',
      icon: CheckSquare,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Task Completion Rate',
      value: taskCompletionRate != null ? `${taskCompletionRate}%` : 'Loading...',
      change: '+1.2%',
      changeType: 'increase',
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Disputes',
      value: disputesCount != null ? disputesCount.toLocaleString() : 'Loading...',
      change: '-50%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const recentActivity = recentUsers.map(user => ({
    id: user._id,
    type: 'user_registration',
    description: `New user registered (Package ${user.package})`,
    user: user.email,
    time: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown',
    status: user.status,
  }));

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor platform performance and manage operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.userTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Earnings by Package */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Package</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.earningsByPackage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="package" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="earnings" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Completion Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
              <Pie
                data={chartData.taskCompletion}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.taskCompletion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Approve Registrations</p>
                  <p className="text-sm text-gray-600">
                    {quickActionsData ? `${quickActionsData.pendingApprovals} pending approvals` : 'Loading...'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/withdrawals')}
              className="w-full text-left p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">Process Withdrawals</p>
                  <p className="text-sm text-gray-600">
                    {quickActionsData ? `${quickActionsData.pendingWithdrawals} pending requests` : 'Loading...'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/tasks/review')}
              className="w-full text-left p-3 rounded-lg hover:bg-orange-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Review Task Submissions</p>
                  <p className="text-sm text-gray-600">
                    {quickActionsData ? `${quickActionsData.pendingReviews} pending reviews` : 'Loading...'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'user_registration' ? 'bg-blue-100' :
                  activity.type === 'withdrawal_request' ? 'bg-yellow-100' :
                  'bg-emerald-100'
                }`}>
                  {activity.type === 'user_registration' && <Users className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'withdrawal_request' && <Wallet className="h-5 w-5 text-yellow-600" />}
                  {activity.type === 'task_completion' && <CheckSquare className="h-5 w-5 text-emerald-600" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.user}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    activity.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <CheckSquare className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600">Task Assignment</p>
            <p className="text-lg font-semibold text-emerald-600">Operational</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Wallet className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600">Payment System</p>
            <p className="text-lg font-semibold text-emerald-600">Operational</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-semibold text-emerald-600">Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
};
