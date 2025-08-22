
import axios from 'axios';
import { BASE_URL } from './Base_Url';

/**
 * Creates standardized API headers for requests
 * @param {string|null} sessionToken - Optional session token for authentication
 * @param {string} contentType - Content type header, defaults to 'application/json'
 * @returns {Object} Headers object for API requests
 */
const createApiHeaders = (sessionToken = null, contentType = 'application/json') => ({
  'Content-Type': contentType,
  ...(sessionToken && { 'access_token': sessionToken }),
});

/**
 * Standardizes API response handling across different response formats
 * @param {Object} response - Axios response object
 * @param {string} successMessage - Default success message if none provided
 * @returns {Object} Standardized response object with status, data, and message
 */
const handleApiResponse = (response, successMessage = 'Operation successful') => {
  const { Status, STATUS, message, data, RDATA, ERROR } = response.data;
  
  if (Status === 'SUCCESS' || (STATUS === '1' && ERROR === '0') || RDATA) {
    return {
      status: 'success',
      data: data || RDATA || response.data,
      message: message || successMessage,
    };
  }
  
  return {
    status: 'failure',
    message: message || 'Something went wrong',
  };
};

/**
 * Standardizes error handling for API requests
 * @param {Error} error - Error object from axios or other sources
 * @param {string} context - Context description for debugging
 * @returns {Object} Standardized error response object
 */
const handleApiError = (error, context = 'API') => {
  console.error(`${context} Error:`, error);
  const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
  return {
    status: 'error',
    message: fallbackMessage,
  };
};

/**
 * Uploads multipart/form-data to the specified endpoint
 * @param {string} endpoint - API endpoint path
 * @param {FormData} payload - FormData object containing files/data
 * @param {string} userToken - User authentication token
 * @returns {Object} Response object with success/fail status
 */
export const uploadMultipartApi = async (endpoint, payload, userToken) => {
  try {
    const headers = createApiHeaders(userToken, 'multipart/form-data');
    const response = await axios.put(`${BASE_URL}/${endpoint}`, payload, { headers });
    
    if (response.data.Status === 'SUCCESS') {
      return { success: response.data.message };
    }
    return { fail: response.data.message };
  } catch (error) {
    return handleApiError(error, 'Upload Multipart');
  }
};

/**
 * Makes a POST request to the specified endpoint
 * @param {Object} payloads - Request payload data
 * @param {string} sessionToken - Session authentication token
 * @param {string} endpoints - API endpoint path
 * @returns {Object} Standardized response object
 */
export const postRequest = async (payloads, sessionToken, endpoints) => {
  try {
    const headers = createApiHeaders(sessionToken);
    const response = await axios.post(`${BASE_URL}/${endpoints}`, payloads, { headers });
    return handleApiResponse(response, 'Data retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'POST Request');
  }
};


/**
 * Makes a GET request to retrieve records from the specified endpoint
 * @param {Object} payloads - Query parameters for the request
 * @param {string} sessionToken - Session authentication token
 * @param {string} endpoints - API endpoint path
 * @returns {Object} Standardized response object with records
 */
export const getRecords = async (payloads, sessionToken, endpoints) => {
  try {
    const headers = createApiHeaders(sessionToken);
    const response = await axios.get(`${BASE_URL}/${endpoints}`, {
      headers,
      params: payloads,
    });
    return handleApiResponse(response, 'Data retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GET Records');
  }
};


export const sendOTP = async (phoneNumber) => {
  try {
    const payload = {
      mobileNumber: phoneNumber,
      requestType: 'customer_approval',
    };
    const headers = createApiHeaders();
    const response = await axios.post(`${BASE_URL}/login/sendOTP`, payload, { headers });
    return handleApiResponse(response, 'OTP sent successfully');
  } catch (error) {
    return handleApiError(error, 'Send OTP');
  }
};

export const verifyOTP = async (otp, code, token) => {
  try {
    const payload = {
      otp,
      referalCode: code,
      token,
    };
    const headers = createApiHeaders();
    const response = await axios.post(`${BASE_URL}/login/verifyOTP`, payload, { headers });
    return handleApiResponse(response, 'OTP verified successfully');
  } catch (error) {
    return handleApiError(error, 'Verify OTP');
  }
};


export const sendOTPPin = async (permanentToken) => {
  try {
    const payload = {
      token: permanentToken,
      requestType: 'customer_approval',
    };
    const headers = createApiHeaders();
    const response = await axios.post(`${BASE_URL}/login/sendOTPToken`, payload, { headers });
    return handleApiResponse(response, 'OTP sent successfully');
  } catch (error) {
    return handleApiError(error, 'Send OTP Pin');
  }
};

export const verifyOTPPin = async (otp, permanentToken, token) => {
  try {
    const payload = { otp, token };
    const headers = createApiHeaders(permanentToken);
    const response = await axios.post(`${BASE_URL}/login/verifyOTP_token`, payload, { headers });
    return handleApiResponse(response, 'OTP verified successfully');
  } catch (error) {
    return handleApiError(error, 'Verify OTP Pin');
  }
};

export const sendAadhaarOTP = async (aadhaarNumber, sessionToken) => {
  try {
    const payload = { aadhaarNumber };
    const headers = createApiHeaders(sessionToken);
    const response = await axios.post(`${BASE_URL}/login/send_otp`, payload, { headers });
    
    console.log('Aadhaar OTP API Response:', response.data);
    
    const result = handleApiResponse(response, 'OTP sent successfully');
    if (result.status === 'success' && result.data?.ref_id) {
      result.ref_id = result.data.ref_id;
    }
    return result;
  } catch (error) {
    return handleApiError(error, 'Send Aadhaar OTP');
  }
};


export const verifyAadhaarOTP = async (otp, refId, sessionToken) => {
  try {
    const payload = { otp, refId };
    const headers = createApiHeaders(sessionToken);
    const response = await axios.post(`${BASE_URL}/login/verify_otp`, payload, { headers });
    return handleApiResponse(response, 'OTP verified successfully');
  } catch (error) {
    return handleApiError(error, 'Verify Aadhaar OTP');
  }
};


export const set4digitPin = async (pin, sessionToken) => {
  try {
    const payload = { pin, token: sessionToken };
    const headers = createApiHeaders();
    const response = await axios.post(`${BASE_URL}/login/pin`, payload, { headers });
    return handleApiResponse(response, 'PIN set successfully');
  } catch (error) {
    return handleApiError(error, 'Set 4 Digit Pin');
  }
};


export const sendPinToWhatsapp = async (sessionToken) => {
  try {
    const payload = {};
    const headers = createApiHeaders(sessionToken);
    const response = await axios.post(`${BASE_URL}/login/getPin`, payload, { headers });
    return handleApiResponse(response, 'PIN sent to WhatsApp successfully');
  } catch (error) {
    return handleApiError(error, 'Send Pin to WhatsApp');
  }
};



export const pinLogin = async (pin, permanentToken) => {
  try {
    const payload = { pin, token: permanentToken };
    const headers = createApiHeaders();
    const response = await axios.post(`${BASE_URL}/login/pinLogin`, payload, { headers });
    return handleApiResponse(response, 'Login successful');
  } catch (error) {
    return handleApiError(error, 'Pin Login');
  }
};

// Backward compatibility exports
export const Upload_Multipart_Api = uploadMultipartApi;
