import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { postRequest } from '../api/baseApi';

// Get base URL based on platform
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('Web origin detected:', origin);
    
    // For development (localhost), use a hardcoded production URL for PayU callbacks
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
      console.log('Development environment detected, using production callback URL');
      return 'https://vasbazaar.webdekho.in';
    }
    
    // Validate the origin URL
    try {
      new URL(origin);
      return origin;
    } catch (error) {
      console.error('Invalid origin URL detected:', origin, error);
      return 'https://vasbazaar.webdekho.in';
    }
  }
  console.log('Using fallback URL: https://vasbazaar.webdekho.in');
  return 'https://vasbazaar.webdekho.in';
};

// PayU Production Credentials
const PAYU_CONFIG = {
  merchantKey: 't88vPU',
  merchantSalt: 'DlHQZP8XlesWjsKMJjnVimMbvwkrS6hg',
  baseUrl: 'https://secure.payu.in/_payment',
  get successUrl() {
    // Always use production domain to avoid CORS middleware issues
    return 'https://vasbazaar.webdekho.in/main/common/PayUCallbackScreen?status=success';
  },
  get failureUrl() {
    // Always use production domain to avoid CORS middleware issues
    return 'https://vasbazaar.webdekho.in/main/common/PayUCallbackScreen?status=failure';
  },
  get cancelUrl() {
    // Always use production domain to avoid CORS middleware issues
    return 'https://vasbazaar.webdekho.in/main/common/PayUCallbackScreen?status=cancelled';
  },
};

/**
 * Generate SHA512 hash for PayU
 * @param {string} text - Text to hash
 * @returns {string} SHA512 hash
 */
const generateHash = (text) => {
  return CryptoJS.SHA512(text).toString();
};

/**
 * Generate PayU payment hash
 * @param {Object} params - Payment parameters
 * @returns {string} Payment hash
 */
const generatePaymentHash = (params) => {
  const { key, txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '', salt } = params;
  
  // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  
  return generateHash(hashString);
};

/**
 * Create PayU payment request
 * @param {Object} paymentData - Payment data
 * @returns {Object} PayU payment request parameters
 */
export const createPayUPaymentRequest = (paymentData) => {
  const {
    amount,
    productInfo,
    firstName,
    email,
    phone,
    transactionId,
    udf1 = '', // Can be used for additional data
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
  } = paymentData;

  // Generate unique transaction ID if not provided
  const txnid = transactionId || `TXN${Date.now()}`;

  // Log the callback URLs for debugging
  console.log('PayU Callback URLs:', {
    success: PAYU_CONFIG.successUrl,
    failure: PAYU_CONFIG.failureUrl,
    cancel: PAYU_CONFIG.cancelUrl,
  });

  // Prepare payment parameters
  const paymentParams = {
    key: PAYU_CONFIG.merchantKey,
    txnid,
    amount: amount.toFixed(2),
    productinfo: productInfo || 'VasBazaar Services',
    firstname: firstName || 'Customer',
    email: email || 'customer@vasbazaar.com',
    phone: phone || '',
    surl: PAYU_CONFIG.successUrl,
    furl: PAYU_CONFIG.failureUrl,
    curl: PAYU_CONFIG.cancelUrl,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    salt: PAYU_CONFIG.merchantSalt,
  };

  // Generate hash
  const hash = generatePaymentHash(paymentParams);

  // Remove salt from final params (not sent to PayU)
  delete paymentParams.salt;

  return {
    ...paymentParams,
    hash,
    service_provider: 'payu_paisa',
  };
};

/**
 * Initiate PayU payment for web platform
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Payment initiation result
 */
export const initiatePayUPaymentWeb = async (paymentData) => {
  try {
    const paymentParams = createPayUPaymentRequest(paymentData);
    
    // Create form and submit
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYU_CONFIG.baseUrl;
    form.target = '_self'; // Open in same window
    
    // Add all parameters as hidden fields
    Object.keys(paymentParams).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = paymentParams[key];
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
    
    return {
      status: 'success',
      message: 'Redirecting to PayU payment gateway...',
      transactionId: paymentParams.txnid,
    };
  } catch (error) {
    console.error('PayU payment initiation error:', error);
    return {
      status: 'error',
      message: 'Failed to initiate payment',
      error: error.message,
    };
  }
};

/**
 * Initiate PayU payment for mobile platforms
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Payment initiation result
 */
export const initiatePayUPaymentMobile = async (paymentData) => {
  try {
    const paymentParams = createPayUPaymentRequest(paymentData);
    
    // Create a temporary HTML page with auto-submitting form
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting to PayU...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h3>Redirecting to PayU...</h3>
          <p>Please wait while we redirect you to payment gateway</p>
        </div>
        <form id="payuForm" method="POST" action="${PAYU_CONFIG.baseUrl}">
          ${Object.keys(paymentParams).map(key => 
            `<input type="hidden" name="${key}" value="${paymentParams[key]}" />`
          ).join('')}
        </form>
        <script>
          document.getElementById('payuForm').submit();
        </script>
      </body>
      </html>
    `;
    
    // Create a data URI for the HTML
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    
    // Open in-app browser with the form
    const result = await WebBrowser.openBrowserAsync(dataUri, {
      showTitle: true,
      enableBarCollapsing: false,
      showInRecents: true,
      dismissButtonStyle: 'cancel',
    });
    
    return {
      status: 'success',
      message: 'Payment browser opened',
      transactionId: paymentParams.txnid,
      browserResult: result,
    };
  } catch (error) {
    console.error('PayU mobile payment error:', error);
    return {
      status: 'error',
      message: 'Failed to open payment browser',
      error: error.message,
    };
  }
};

/**
 * Initiate PayU payment based on platform
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Payment initiation result
 */
export const initiatePayUPayment = async (paymentData) => {
  if (Platform.OS === 'web') {
    return initiatePayUPaymentWeb(paymentData);
  } else {
    return initiatePayUPaymentMobile(paymentData);
  }
};

/**
 * Verify PayU payment response
 * @param {Object} responseData - Response data from PayU
 * @returns {Object} Verification result
 */
export const verifyPayUResponse = (responseData) => {
  const {
    mihpayid,
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    hash: responseHash,
    additionalCharges = '',
  } = responseData;

  // Generate reverse hash for verification
  // Formula: sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
  let hashString = '';
  
  if (additionalCharges) {
    hashString = `${additionalCharges}|`;
  }
  
  hashString += `${PAYU_CONFIG.merchantSalt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.merchantKey}`;
  
  const calculatedHash = generateHash(hashString);
  const isValid = calculatedHash === responseHash;
  
  return {
    isValid,
    status,
    transactionId: txnid,
    payuTransactionId: mihpayid,
    amount,
    message: isValid ? 'Payment verified successfully' : 'Payment verification failed',
  };
};

/**
 * Handle PayU callback and redirect to PendingScreen
 * @param {Object} callbackData - Callback data from PayU
 * @param {Object} router - Router object for navigation
 * @returns {void}
 */
export const handlePayUCallback = async (callbackData, router) => {
  console.log('PayU Callback Data:', callbackData);
  
  const { status, txnid, amount, productinfo, ...otherParams } = callbackData;
  
  // If txnid is missing, try to get it from AsyncStorage or generate fallback
  let transactionId = txnid;
  if (!transactionId) {
    try {
      // Try to get the saved transaction data
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedTxnData = await AsyncStorage.getItem('pendingPayUTransaction');
      if (savedTxnData) {
        const parsedData = JSON.parse(savedTxnData);
        transactionId = parsedData.transactionId;
        console.log('Retrieved transaction ID from storage:', transactionId);
      }
    } catch (error) {
      console.error('Error retrieving transaction ID:', error);
    }
    
    // If still no transaction ID, generate a fallback
    if (!transactionId) {
      transactionId = `TXN${Date.now()}`;
      console.log('Generated fallback transaction ID:', transactionId);
    }
  }
  
  // Verify the response only if we have proper data
  let verification = { isValid: false };
  if (txnid && status) {
    verification = verifyPayUResponse(callbackData);
    console.log('PayU Verification Result:', verification);
  } else {
    console.log('Skipping verification due to missing callback data');
  }
  
  // Navigate to PendingScreen with transaction details
  const pendingParams = {
    txn_id: transactionId,
    transactionId: transactionId,
    amount: amount || '0',
    productInfo: productinfo || 'VasBazaar Services',
    paymentStatus: status || 'cancelled',
    paymentMethod: 'payu',
    isPaymentVerified: verification.isValid,
    ...otherParams,
  };
  
  console.log('Redirecting to PendingScreen with params:', pendingParams);
  
  // Always redirect to PendingScreen
  // PendingScreen will check the actual status via API
  router.replace({
    pathname: '/main/common/PendingScreen',
    params: pendingParams,
  });
};

/**
 * Create PayU payment session on backend
 * @param {Object} paymentData - Payment data
 * @param {string} sessionToken - Session token
 * @returns {Promise} Backend response
 */
export const createPayUPaymentSession = async (paymentData, sessionToken) => {
  try {
    const response = await postRequest('api/payment/payu/create', paymentData, sessionToken);
    
    if (response?.status === 'success') {
      return {
        status: 'success',
        data: response.data,
        message: 'Payment session created',
      };
    }
    
    return {
      status: 'error',
      message: response?.message || 'Failed to create payment session',
    };
  } catch (error) {
    console.error('Payment session creation error:', error);
    return {
      status: 'error',
      message: 'Network error while creating payment session',
    };
  }
};