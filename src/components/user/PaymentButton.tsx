import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface PaymentButtonProps {
  packagePrice: number;
  packageName: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ packagePrice, packageName }) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const { paymentStatus, isPolling, error: pollingError, startPolling, stopPolling } = usePaymentStatus();

  const handlePayment = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    stopPolling(); // Stop any existing polling

    try {
      // Format phone number for Safaricom (remove spaces and ensure 254XXXXXXXX format)
      let formattedPhone = phoneNumber.replace(/\s+/g, ''); // Remove spaces

      // Convert to Safaricom required format (254XXXXXXXX without +)
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('+254')) {
        formattedPhone = formattedPhone.substring(1); // remove '+'
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      // For sandbox testing, use valid test phone numbers
      const sandboxTestNumbers = ['254708374149', '254728031465', '254791981000', '254759764065'];
      if (process.env.NODE_ENV === 'development' && !sandboxTestNumbers.includes(formattedPhone)) {
        formattedPhone = '254708374149'; // Use default test number for sandbox
        setMessage('Using sandbox test phone number: 254708374149');
      }

      console.log('Formatted phone number for M-Pesa:', formattedPhone);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/payment/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: packagePrice
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Start polling for payment status
      if (data.paymentId) {
        setPaymentId(data.paymentId);
        startPolling(data.paymentId);
        setMessage('Payment request sent. Please complete the payment on your phone. Status will update automatically.');
      } else {
        setMessage('Payment request sent. Please complete the payment on your phone.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle payment status changes
  useEffect(() => {
    if (paymentStatus) {
      switch (paymentStatus.status) {
        case 'completed':
          setMessage('✅ Payment completed successfully! Your account has been activated.');
          setError(null);
          // Optionally refresh user data or redirect
          break;
        case 'failed':
          setMessage(null);
          setError('❌ Payment failed. Please try again or contact support.');
          break;
        case 'cancelled':
          setMessage(null);
          setError('⚠️ Payment was cancelled. Please try again.');
          break;
        default:
          // Still pending, keep polling
          break;
      }
    }
  }, [paymentStatus]);

  // Effect to handle polling errors
  useEffect(() => {
    if (pollingError) {
      setError(`Status check error: ${pollingError}`);
    }
  }, [pollingError]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const getStatusIcon = () => {
    if (!paymentStatus) return null;

    switch (paymentStatus.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    if (!paymentStatus) return 'text-gray-600';

    switch (paymentStatus.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">Complete Payment for Package {packageName}</h3>
      <p className="mb-4">Amount: KES {packagePrice.toLocaleString()}</p>

      {/* Payment Status Display */}
      {paymentStatus && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center justify-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              Payment {paymentStatus.status.charAt(0).toUpperCase() + paymentStatus.status.slice(1)}
            </span>
            {isPolling && (
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            )}
          </div>
          {paymentStatus.transactionId && (
            <p className="text-sm text-gray-600 mt-1">
              Transaction ID: {paymentStatus.transactionId}
            </p>
          )}
          {isPolling && (
            <p className="text-xs text-gray-500 mt-1">
              Checking status every 5 seconds...
            </p>
          )}
        </div>
      )}

      <label htmlFor="phoneNumber" className="block mb-1 font-medium text-gray-700">
        Phone Number for M-Pesa Payment
      </label>
      <input
        id="phoneNumber"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="mb-4 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="+254700000000"
      />
      <button
        onClick={handlePayment}
        disabled={loading || !phoneNumber || isPolling}
        className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
          loading || !phoneNumber || isPolling ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : isPolling ? 'Monitoring Payment...' : 'Pay Now'}
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};
