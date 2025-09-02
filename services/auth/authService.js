import { postRequest, postRequestWithAuth } from '../api/baseApi';

// Simple authentication functions

export const sendLoginOtp = async (mobileNumber, referralCode = null) => {
  const payload = {
    mobileNumber,
    requestType: 'customer_approval',
    ...(referralCode && { referralCode }),
  };
  
  return await postRequest('login/sendOTP', payload);
};

export const verifyLoginOtp = async (otp, referralCode, token) => {
  const payload = {
    otp,
    referalCode: referralCode,
    token,
  };
  
  return await postRequest('login/verifyOTP', payload);
};

export const sendPinOtp = async (permanentToken) => {
  const payload = {
    token: permanentToken,
    requestType: 'customer_approval',
  };
  
  return await postRequest('login/sendOTPToken', payload);
};

export const verifyPinOtp = async (otp, permanentToken, tempToken) => {
  const payload = { 
    otp, 
    token: tempToken 
  };
  
  // Use permanentToken as access_token in header
  
  return await postRequest('login/verifyOTP_token', payload, permanentToken);
};

export const setUserPin = async (pin, sessionToken) => {
  const payload = { 
    pin, 
    token: sessionToken 
  };
  
  return await postRequest('login/pin', payload);
};

export const authenticateWithPin = async (pin, permanentToken) => {
  const payload = { 
    pin,
    token: permanentToken
  };
  
  return await postRequestWithAuth('login/pinLogin', payload, permanentToken);
};

export const sendPinToWhatsapp = async (sessionToken) => {
  return await postRequest('login/getPin', {}, sessionToken);
};

// Legacy exports for backward compatibility
export const sendOTP = sendLoginOtp;
export const verifyOTP = verifyLoginOtp;
export const sendOTPPin = sendPinOtp;
export const verifyOTPPin = verifyPinOtp;
export const set4digitPin = setUserPin;
export const pinLogin = authenticateWithPin;