
import axios from 'axios';
import { BASE_URL } from './Base_Url';

export const Upload_Multipart_Api = async (endpoint, payload, userToken) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/${endpoint}`,
      payload, // Pass FormData directly
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          access_token: userToken,
        },
      }
    );

    if (response.data.Status === 'SUCCESS') {
      return { success: response.data.message };
    } else {
      return { fail: response.data.message };
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return { fail: errorMessage, errors: error.response?.data?.errors };
  }
};

export const postRequest = async (payloads, sessionToken, endpoints) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'access_token': sessionToken, // Add token to header
    };

    const response = await axios.post(
      `${BASE_URL}/${endpoints}`,
      payloads, // For POST, data goes in the body
      { headers }
    );

    const { Status, message, data } = response.data;

    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data,
        message: message || 'Data retrieved successfully',
      };
    }else if((response.data.STATUS==='1' && response.data.ERROR==='0') || response.data.RDATA){
      return {
        status: 'success',
        message: message || 'get data',
        data:response.data.RDATA || response.data
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('getRecords (POST) Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const getRecords = async (payloads, sessionToken, endpoints) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'access_token': sessionToken, // Pass token here
    };

    const response = await axios.get(`${BASE_URL}/${endpoints}`, {
      headers,
      params: payloads, // For GET, use `params` key for query parameters
    });

    const { Status, message, data } = response.data;

    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data,
        message: message || 'Data retrieved successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('getRecords Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const sendOTP = async (phoneNumber) => {
  try {
    const payload = {
      mobileNumber: phoneNumber,
      requestType: 'customer_approval', // or 'SIGNUP' based on your use case
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await axios.post(`${BASE_URL}/login/sendOTP`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'OTP sent successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};

export const verifyOTP = async (otp,code,token) => {
  try {
    const payload = {
      otp: otp,
      'referalCode':code,
      token
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await axios.post(`${BASE_URL}/login/verifyOTP`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'OTP verified successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const sendOTPPin = async (permanentToken) => {
  try {
    const payload = {
      token: permanentToken,
      requestType: 'customer_approval', // or 'SIGNUP' based on your use case
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await axios.post(`${BASE_URL}/login/sendOTPToken`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'OTP sent successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};

export const verifyOTPPin = async (otp, permanentToken, token) => {
  try {
    const payload = {
      otp: otp,
      token: token,
    };
    const headers = {
      'Content-Type': 'application/json',
      access_token: permanentToken
    };
    const response = await axios.post(`${BASE_URL}/login/verifyOTP_token`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'OTP verified successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};

export const sendAadhaarOTP = async (aadhaar_number,sessionToken) => {
  try {
    const payload = {
      aadhaarNumber: aadhaar_number,
    };
    const headers = {
      'Content-Type': 'application/json',
      'access_token': sessionToken,
    };
    const response = await axios.post(`${BASE_URL}/login/send_otp`, payload, { headers });

    console.log("api REspose",response.data);

    const { Status, message, data } = response.data;
    


    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        ref_id:data.ref_id, // usually a token or OTP reference
        message: message || 'OTP sent successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const verifyAadhaarOTP = async (otp,refId,sessionToken) => {
  try {
    const payload = {
      otp: otp,
      refId: refId
    };
    const headers = {
      'Content-Type': 'application/json',
      access_token: sessionToken,
    };
    const response = await axios.post(`${BASE_URL}/login/verify_otp`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'OTP verified successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const set4digitPin = async (pin,sessionToken) => {
  try {
    const payload = {
      pin: pin,
      'token':sessionToken
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await axios.post(`${BASE_URL}/login/pin`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'PIN set successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};


export const sendPinToWhatsapp = async (sessionToken) => {
  try {
    const payload = {};
    const headers = {
      'Content-Type': 'application/json',
      'access_token':sessionToken
    };
    const response = await axios.post(`${BASE_URL}/login/getPin`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'PIN sent to WhatsApp successfully',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};



export const pinLogin = async (pin,permanentToken) => {
  try {
    const payload = {
      pin: pin,
      token:permanentToken
    };
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await axios.post(`${BASE_URL}/login/pinLogin`, payload, { headers });
    const { Status, message, data } = response.data;
    if (Status === 'SUCCESS') {
      return {
        status: 'success',
        data, // usually a token or OTP reference
        message: message || 'Login successful',
      };
    } else {
      return {
        status: 'failure',
        message: message || 'Something went wrong',
      };
    }

  } catch (error) {
    // console.error('sendOTP Error:', error);
    const fallbackMessage = error?.response?.data?.message || 'Network or server error. Please try again later.';
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
};

