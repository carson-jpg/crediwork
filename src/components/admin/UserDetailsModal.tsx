import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, CreditCard, Wallet, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface UserDetails {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    package: string;
    packageAmount: number;
    dailyEarning: number;
    status: string;
    activationDate: string | null;
    paymentProof: string | null;
    kycData: {
      idNumber: string;
      mpesaPhone: string;
      verified: boolean;
    } | null;
    referralCode: string | null;
    referredBy: string | null;
    lastLogin: string | null;
    deviceFingerprint: string | null;
    createdAt: string;
    updatedAt: string;
  };
  wallet: {
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
    lastUpdated: string;
  };
  statistics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    successRate: number;
  };
  recentActivity: {
    submissions: Array<{
      _id: string;
      taskId: {
        title: string;
        reward: number;
      };
      status: string;
      submittedAt: string;
      earnedAmount: number;
    }>;
    withdrawals: Array<{
      _id: string;
      amount: number;
      status: string;
      paymentMethod: string;
      createdAt: string;
      processedAt: string | null;
    }>;
    payments: Array<{
      _id: string;
      amount: number;
      status: string;
      mpesaReceiptNumber: string | null;
      transactionDate: string | null;
    }>;
  };
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, userId }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUserDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'banned':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchUserDetails}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userDetails.user.firstName} {userDetails.user.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {userDetails.user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {userDetails.user.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{userDetails.user.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userDetails.user.status)}`}>
                        {getStatusIcon(userDetails.user.status)}
                        <span className="ml-1 capitalize">{userDetails.user.status}</span>
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(userDetails.user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package & Financial Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Package Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Package:</span>
                      <span className="text-sm text-gray-900 font-medium">{userDetails.user.package}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Package Amount:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(userDetails.user.packageAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Daily Earning:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(userDetails.user.dailyEarning)}</span>
                    </div>
                    {userDetails.user.activationDate && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Activated:</span>
                        <span className="text-sm text-gray-900">{formatDate(userDetails.user.activationDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Wallet Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Current Balance:</span>
                      <span className="text-sm text-gray-900 font-medium">{formatCurrency(userDetails.wallet.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Total Earned:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(userDetails.wallet.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Total Withdrawn:</span>
                      <span className="text-sm text-gray-900">{formatCurrency(userDetails.wallet.totalWithdrawn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                      <span className="text-sm text-gray-900">{formatDate(userDetails.wallet.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Task Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userDetails.statistics.totalTasks}</div>
                    <div className="text-sm text-gray-500">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userDetails.statistics.completedTasks}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{userDetails.statistics.pendingTasks}</div>
                    <div className="text-sm text-gray-500">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userDetails.statistics.successRate}%</div>
                    <div className="text-sm text-gray-500">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Submissions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
                  <div className="space-y-3">
                    {userDetails.recentActivity.submissions.length > 0 ? (
                      userDetails.recentActivity.submissions.map((submission) => (
                        <div key={submission._id} className="border-l-4 border-blue-500 pl-3">
                          <div className="text-sm font-medium text-gray-900">{submission.taskId.title}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(submission.submittedAt)} • {formatCurrency(submission.earnedAmount)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                            submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent submissions</p>
                    )}
                  </div>
                </div>

                {/* Recent Withdrawals */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Withdrawals</h3>
                  <div className="space-y-3">
                    {userDetails.recentActivity.withdrawals.length > 0 ? (
                      userDetails.recentActivity.withdrawals.map((withdrawal) => (
                        <div key={withdrawal._id} className="border-l-4 border-green-500 pl-3">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(withdrawal.createdAt)} • {withdrawal.paymentMethod}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent withdrawals</p>
                    )}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
                  <div className="space-y-3">
                    {userDetails.recentActivity.payments.length > 0 ? (
                      userDetails.recentActivity.payments.map((payment) => (
                        <div key={payment._id} className="border-l-4 border-purple-500 pl-3">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                          <div className="text-xs text-gray-500">
                            {payment.transactionDate ? formatDate(payment.transactionDate) : 'Processing'}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent payments</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(userDetails.user.kycData || userDetails.user.referralCode || userDetails.user.lastLogin) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userDetails.user.kycData && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">KYC Information</label>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-900">ID Number: {userDetails.user.kycData.idNumber || 'N/A'}</p>
                          <p className="text-sm text-gray-900">M-Pesa Phone: {userDetails.user.kycData.mpesaPhone || 'N/A'}</p>
                          <p className="text-sm text-gray-900">Verified: {userDetails.user.kycData.verified ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    )}
                    {userDetails.user.referralCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Referral</label>
                        <p className="mt-1 text-sm text-gray-900">Code: {userDetails.user.referralCode}</p>
                      </div>
                    )}
                    {userDetails.user.lastLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Last Login</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(userDetails.user.lastLogin)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
