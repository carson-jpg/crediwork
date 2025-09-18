import React, { useState } from 'react';

interface PaymentButtonProps {
  packagePrice: number;
  packageName: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ packagePrice, packageName }) => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(packagePrice);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseClass, setResponseClass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage('');
    setResponseClass('');

    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'https://crediwork.onrender.com';
      const res = await fetch(`${baseURL}/api/payment/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: phone, amount: Number(amount) })
      });

      const data = await res.json();

      if (res.ok) {
        setResponseClass('success');
        setResponseMessage('STK Push initiated successfully: ' + JSON.stringify(data));
      } else {
        setResponseClass('error');
        setResponseMessage('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      setResponseClass('error');
      setResponseMessage('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '10px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    label: {
      marginBottom: '5px'
    },
    input: {
      marginBottom: '15px',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px'
    },
    button: {
      padding: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: loading ? 'not-allowed' : 'pointer'
    },
    response: {
      marginTop: '20px',
      padding: '10px',
      borderRadius: '4px',
      display: responseMessage ? 'block' : 'none'
    },
    success: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24'
    }
  };

  return (
    <div style={styles.container}>
      <h2>M-Pesa STK Push</h2>
      <form id="stkForm" style={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="phone" style={styles.label}>Phone Number (254...):</label>
        <input
          type="text"
          id="phone"
          name="phone"
          required
          placeholder="254712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
          disabled={loading}
        />

        <label htmlFor="amount" style={styles.label}>Amount (KES):</label>
        <input
          type="number"
          id="amount"
          name="amount"
          required
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={styles.input}
          disabled={loading}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Processing...' : 'Initiate STK Push'}
        </button>
      </form>
      <div
        id="response"
        style={{
          ...styles.response,
          ...(responseClass === 'success' ? styles.success : {}),
          ...(responseClass === 'error' ? styles.error : {})
        }}
      >
        {responseMessage}
      </div>
    </div>
  );
};
