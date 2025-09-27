import { useState, useEffect, useCallback } from 'react';

interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  transactionId: string | null;
  receiptNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsePaymentStatusReturn {
  paymentStatus: PaymentStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (paymentId: string) => void;
  stopPolling: () => void;
  refreshStatus: () => Promise<void>;
}

export const usePaymentStatus = (): UsePaymentStatusReturn => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const fetchPaymentStatus = useCallback(async (id: string): Promise<PaymentStatus | null> => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com');
      const response = await fetch(`${baseURL}/api/payment/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment status');
      return null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!paymentId) return;

    const status = await fetchPaymentStatus(paymentId);
    if (status) {
      setPaymentStatus(status);
      setError(null);

      // Stop polling if payment is completed or failed
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        stopPolling();
      }
    }
  }, [paymentId, fetchPaymentStatus]);

  const startPolling = useCallback((id: string) => {
    setPaymentId(id);
    setIsPolling(true);
    setError(null);

    // Initial fetch
    refreshStatus();

    // Start polling every 5 seconds
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    setIntervalId(interval);
  }, [refreshStatus]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    paymentStatus,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refreshStatus,
  };
};
