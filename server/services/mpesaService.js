import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';

dotenv.config();

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_ENV,
  MPESA_CALLBACK_URL
} = process.env;

const baseUrls = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

const baseUrl = MPESA_ENV === 'production' ? baseUrls.production : baseUrls.sandbox;

let accessToken = null;
let tokenExpiry = null;

export async function getAccessToken() {
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    accessToken = response.data.access_token;
    tokenExpiry = new Date(new Date().getTime() + (response.data.expires_in - 60) * 1000); // 60s buffer
    return accessToken;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error.response?.data || error.message);
    throw error;
  }
}

function getTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  const hour = (`0${date.getHours()}`).slice(-2);
  const minute = (`0${date.getMinutes()}`).slice(-2);
  const second = (`0${date.getSeconds()}`).slice(-2);
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function getPassword(shortcode, passkey, timestamp) {
  const dataToEncode = shortcode + passkey + timestamp;
  return Buffer.from(dataToEncode).toString('base64');
}

export async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
  console.log('Initiating STK Push with params:', {
    phoneNumber,
    amount,
    accountReference,
    transactionDesc,
    baseUrl,
    shortcode: MPESA_SHORTCODE,
    callbackUrl: MPESA_CALLBACK_URL
  });

  try {
    const token = await getAccessToken();
    console.log('Got access token:', token ? 'Yes' : 'No');

    if (!token) {
      return {
        success: false,
        error: 'Failed to obtain access token'
      };
    }

    const timestamp = getTimestamp();
    const password = getPassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

    // Use a default callback URL for development if not provided
    const callbackUrl = MPESA_CALLBACK_URL || 'https://webhook.site/your-webhook-url';

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallbackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    };

    console.log('STK Push payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('STK Push response:', response.data);

    // Check if the response indicates success
    if (response.data.ResponseCode === '0') {
      return {
        success: true,
        transactionId: response.data.CheckoutRequestID,
        response: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.ResponseDescription || 'STK Push failed',
        response: response.data
      };
    }
  } catch (error) {
    console.error('Failed to initiate STK push:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific token errors
    if (error.response?.status === 401 || error.response?.data?.errorMessage?.includes('token')) {
      // Clear cached token to force refresh on next request
      accessToken = null;
      tokenExpiry = null;
      return {
        success: false,
        error: 'Invalid or expired token. Token has been cleared for refresh.'
      };
    }

    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to initiate STK push'
    };
  }
}
