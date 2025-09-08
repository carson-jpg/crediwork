import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  Eye,
  Clock,
  DollarSign,
  User,
  Sliders
} from 'lucide-react';
import axios from 'axios';

export const WithdrawalManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [currentPage] = useState(1);

  useEffect(() => {
    fetchWithdrawals();
  }, [selectedStatus, currentPage]);

  const fetchWithdrawals = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await axios.get(`${baseURL}/api/admin/withdrawals?${params}`, { headers });

      // Transform the data to match the expected format
      const transformedWithdrawals = response.data.withdrawals.map((withdrawal: any) => ({
        _id: withdrawal._id,
        userName: `${withdrawal.userId.firstName} ${withdrawal.userId.lastName}`,
        userEmail: withdrawal.userId.email,
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        mpesaPhone: withdrawal.paymentDetails?.mpesaPhone,
        bankAccount: withdrawal.paymentDetails?.bankAccount,
        bankName: withdrawal.paymentDetails?.bankName,
        requestedAt: new Date(withdrawal.createdAt),
        processedAt: withdrawal.processedAt ? new Date(withdrawal.processedAt) : null,
      }));

      setWithdrawals(transformedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    }
  };

  const handleApproval = (withdrawalId: string, action: 'approve' | 'reject') => {
    console.log('Withdrawal action:', { withdrawalId, action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'mpesa' ? '📱' : '🏦';
  };

  const filteredWithdrawals = withdrawals;

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="text-gray-600">Review and process withdrawal requests</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingWithdrawals.length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-600">KES {totalPendingAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-emerald-600">24</p>
            </div>
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Sliders className="h-5 w-5 text-gray-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Withdrawals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{withdrawal.userName}</div>
                        <div className="text-sm text-gray-500">{withdrawal.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      KES {withdrawal.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getMethodIcon(withdrawal.method)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {withdrawal.method}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawal.method === 'mpesa' 
                            ? withdrawal.accountDetails.phoneNumber 
                            : `${withdrawal.accountDetails.bankName} - ${withdrawal.accountDetails.accountNumber}`
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{withdrawal.requestedAt.toLocaleDateString()}</div>
                    <div>{withdrawal.requestedAt.toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproval(withdrawal._id, 'approve')}
                            className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition-colors"
                            title="Approve Withdrawal"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApproval(withdrawal._id, 'reject')}
                            className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                            title="Reject Withdrawal"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        className="text-gray-600 hover:text-gray-700 p-1 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredWithdrawals.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawals Found</h3>
          <p className="text-gray-600">No withdrawal requests match the current filter</p>
        </div>
      )}
    </div>
  );
};
