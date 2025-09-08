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

  const token = await getAccessToken();
  console.log('Got access token:', token ? 'Yes' : 'No');

  const timestamp = getTimestamp();
  const password = getPassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallbackURL: MPESA_CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  };

  console.log('STK Push payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('STK Push response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to initiate STK push:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}
