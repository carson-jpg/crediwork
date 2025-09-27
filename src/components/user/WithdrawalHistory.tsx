import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletData } from '../../hooks/useWalletData';
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const WithdrawalHistory: React.FC = () => {
  const { user } = useAuth();
  const { canWithdraw, daysUntilWithdrawal } = useWalletData(user);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentDetails, setPaymentDetails] = useState({ mpesaPhone: '', bankAccount: '', bankName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user, page]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com');

      const response = await axios.get(`${baseURL}/api/user/withdrawals?page=${page}&limit=10`, { headers });
      setWithdrawals(response.data.withdrawals);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const amountNum = parseFloat(withdrawAmount);
    const minAmount = user?.package === 'A' ? 500 : 1000;
    if (isNaN(amountNum) || amountNum < minAmount) {
      setError(`Minimum withdrawal amount is KES ${minAmount}`);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal History</h1>
        <p className="text-gray-600 mt-1">Track your withdrawal requests and their status</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
        {successMessage && <div className="mb-4 text-green-600 font-medium">{successMessage}</div>}
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <input
              type="number"
              id="amount"
              min={user?.package === 'A' ? 500 : 1000}
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
        {withdrawals.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {withdrawals.map((withdrawal: any) => (
                <div key={withdrawal._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(withdrawal.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          KES {withdrawal.amount.toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {withdrawal.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Transfer'} •
                          {new Date(withdrawal.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {withdrawal.payoutReference && (
                          <p className="text-sm text-gray-500 mt-1">
                            Reference: {withdrawal.payoutReference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                      {withdrawal.processedAt && (
                        <div className="text-right text-sm text-gray-500">
                          Processed: {new Date(withdrawal.processedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {withdrawal.adminNotes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Admin Notes:</strong> {withdrawal.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal History</h3>
            <p className="text-gray-600">Your withdrawal requests will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
