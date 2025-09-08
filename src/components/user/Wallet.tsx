import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletData } from '../../hooks/useWalletData';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Info
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const { wallet, canWithdraw, daysUntilWithdrawal } = useWalletData(user);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('mpesa');
  const [accountDetails, setAccountDetails] = useState('');

  const handleWithdrawalRequest = () => {
    // Mock withdrawal request
    console.log('Withdrawal requested:', {
      amount: withdrawalAmount,
      method: withdrawalMethod,
      accountDetails,
    });
    setShowWithdrawalForm(false);
    setWithdrawalAmount('');
    setAccountDetails('');
  };

  const walletStats = [
    {
      label: 'Available Balance',
      value: `KES ${wallet?.availableBalance.toLocaleString() || 0}`,
      icon: WalletIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Ready for withdrawal'
    },
    {
      label: 'Pending Balance',
      value: `KES ${wallet?.pendingBalance.toLocaleString() || 0}`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Awaiting approval'
    },
    {
      label: 'Total Earned',
      value: `KES ${wallet?.totalEarned.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Lifetime earnings'
    },
    {
      label: 'Total Withdrawn',
      value: `KES ${wallet?.totalWithdrawn.toLocaleString() || 0}`,
      icon: ArrowDownLeft,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Successfully withdrawn'
    },
  ];

  const recentTransactions = [
    {
      id: '1',
      type: 'earning',
      description: 'Task completion reward',
      amount: user?.dailyEarning || 50,
      date: new Date(),
      status: 'completed'
    },
    {
      id: '2',
      type: 'earning',
      description: 'Task completion reward',
      amount: user?.dailyEarning || 50,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'completed'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600">Manage your earnings and withdrawals</p>
        </div>
        
        {canWithdraw && (
          <button
            onClick={() => setShowWithdrawalForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Request Withdrawal</span>
          </button>
        )}
      </div>

      {/* Withdrawal Eligibility Info */}
      {!canWithdraw && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Withdrawal Requirements</h3>
            <p className="text-blue-700 text-sm mt-1">
              {daysUntilWithdrawal > 0 
                ? `You can request withdrawals in ${daysUntilWithdrawal} days (10 days after activation)`
                : 'Minimum withdrawal amount is KES 300'
              }
            </p>
          </div>
        </div>
      )}

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {walletStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600">+KES {transaction.amount}</p>
                <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Form Modal */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Withdrawal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  min="300"
                  max={wallet?.availableBalance || 0}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum KES 300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {withdrawalMethod === 'mpesa' ? 'M-Pesa Phone Number' : 'Account Number'}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={withdrawalMethod === 'mpesa' ? '+254700000000' : 'Account number'}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleWithdrawalRequest}
                disabled={!withdrawalAmount || !accountDetails}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};