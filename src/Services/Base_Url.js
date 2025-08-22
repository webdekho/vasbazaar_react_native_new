/**
 * API Configuration
 * Centralized configuration for API endpoints and base URLs
 */

// Production API base URL
// export const BASE_URL = 'https://apis.vasbazaar.com';

// Development API base URL (uncomment for local development)
export const BASE_URL = 'http://192.168.1.8:8080';

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    SEND_OTP: 'login/sendOTP',
    VERIFY_OTP: 'login/verifyOTP',
    SEND_OTP_TOKEN: 'login/sendOTPToken',
    VERIFY_OTP_TOKEN: 'login/verifyOTP_token',
    PIN_LOGIN: 'login/pinLogin',
    SET_PIN: 'login/pin',
    GET_PIN: 'login/getPin',
    SEND_AADHAAR_OTP: 'login/send_otp',
    VERIFY_AADHAAR_OTP: 'login/verify_otp',
  },
  
  // Customer endpoints
  CUSTOMER: {
    WALLET_TRANSACTIONS: 'api/customer/wallet_transaction/getAll',
    PROFILE: 'api/customer/profile',
    BANK_ACCOUNT: 'api/customer/bank_account',
  },
  
  // Payment endpoints
  PAYMENT: {
    PAY: 'pay',
    PAYMENT_STATUS: 'payment/status',
  },
  
  // Service endpoints
  SERVICES: {
    OPERATORS: 'services/operators',
    PLANS: 'services/plans',
    BILLERS: 'services/billers',
  },
};

export default {
  BASE_URL,
  API_ENDPOINTS,
};
