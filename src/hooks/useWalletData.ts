import { useState, useEffect } from 'react';
import { Wallet, User } from '../types';

export const useWalletData = (user: User | null) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com');
        const response = await fetch(`${baseURL}/api/user/wallet`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }

        const data = await response.json();

        // Fetch pending withdrawals to calculate pendingBalance
        const withdrawalsResponse = await fetch(`${baseURL}/api/user/withdrawals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        let pendingBalance = 0;
        if (withdrawalsResponse.ok) {
          const withdrawalsData = await withdrawalsResponse.json();
          pendingBalance = withdrawalsData.withdrawals
            .filter((w: any) => w.status === 'pending' || w.status === 'processing')
            .reduce((sum: number, w: any) => sum + w.amount, 0);
        }

        setWallet({
          _id: data._id,
          userId: data.userId,
          availableBalance: data.balance,
          pendingBalance,
          totalEarned: data.totalEarned,
          totalWithdrawn: data.totalWithdrawn,
          lastUpdated: new Date(data.lastUpdated),
        });
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  const canWithdraw = (wallet: Wallet | null, user: User | null): boolean => {
    if (!wallet || !user?.activationDate) return false;

    const daysSinceActivation = Math.floor(
      (new Date().getTime() - new Date(user.activationDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // User can withdraw if 10 days passed and available balance minus pending withdrawals >= 300
    const effectiveBalance = wallet.availableBalance - wallet.pendingBalance;
    return daysSinceActivation >= 10 && effectiveBalance >= 300;
  };

  const daysUntilWithdrawal = user?.activationDate ? Math.max(0, 10 - Math.floor(
    (new Date().getTime() - new Date(user.activationDate).getTime()) / (1000 * 60 * 60 * 24)
  )) : 10;

  return {
    wallet,
    isLoading,
    error,
    canWithdraw: canWithdraw(wallet, user),
    daysUntilWithdrawal,
  };
};
