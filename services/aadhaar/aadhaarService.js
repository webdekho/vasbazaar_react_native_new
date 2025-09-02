import { postRequest } from '../api/baseApi';

// Simple Aadhaar verification functions

export const sendAadhaarOtp = async (aadhaarNumber, permanentToken) => {
  try {
    const payload = { 
      aadhaarNumber: aadhaarNumber.replace(/\D/g, '') // Remove all non-digits
    };
    
    
    const result = await postRequest('login/send_otp', payload, permanentToken);
    
    
    // Handle both SUCCESS and success status formats
    if (result?.status === 'SUCCESS' || result?.Status === 'SUCCESS' || result?.status === 'success') {
      return {
        status: 'success',
        message: result.message || 'OTP sent successfully',
        ref_id: result.ref_id || result.data?.ref_id,
        data: result.data
      };
    }
    
    // Handle FAILURE status with detailed error parsing
    if (result?.Status === 'FAILURE' || result?.status === 'FAILURE') {
      let errorMessage = 'Failed to send OTP';
      
      // Try to parse vendor API error message for more specific errors
      if (result.message && result.message.includes('vendor API')) {
        try {
          // Extract JSON from vendor error message
          const jsonMatch = result.message.match(/\{.*\}/s);
          if (jsonMatch) {
            const vendorError = JSON.parse(jsonMatch[0]);
            if (vendorError.data?.status === 'invalid_aadhaar') {
              errorMessage = 'Invalid Aadhaar number. Please check and try again.';
            } else if (vendorError.message) {
              errorMessage = vendorError.message;
            }
          }
        } catch (parseError) {
          errorMessage = 'Invalid Aadhaar number or service temporarily unavailable.';
        }
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      return {
        status: 'error',
        message: errorMessage,
        statusCode: result?.StatusCode || result?.status_code || 400,
        data: result?.data
      };
    }
    
    // Handle other failure cases
    return {
      status: 'error',
      message: result?.message || 'Failed to send OTP',
      statusCode: result?.StatusCode || result?.status_code,
      data: result?.data
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Network error while sending OTP'
    };
  }
};

export const verifyAadhaarOtp = async (otp, refId, permanentToken) => {
  try {
    const payload = { 
      otp: otp.toString(),
      refId: refId.toString()
    };
    
    
    const result = await postRequest('login/verify_otp', payload, permanentToken);
    
    
    // Handle both SUCCESS and success status formats
    if (result?.Status === 'SUCCESS' || result?.status === 'SUCCESS' || result?.status === 'success') {
      return {
        status: 'success',
        message: result.message || 'Aadhaar verified successfully',
        data: result.data,
        statusCode: result.StatusCode || 200
      };
    }
    
    // Handle FAILURE status with detailed error parsing
    if (result?.Status === 'FAILURE' || result?.status === 'FAILURE') {
      let errorMessage = 'OTP verification failed';
      
      // Try to parse vendor API error message for more specific errors
      if (result.message && result.message.includes('vendor API')) {
        try {
          // Extract JSON from vendor error message
          const jsonMatch = result.message.match(/\{.*\}/s);
          if (jsonMatch) {
            const vendorError = JSON.parse(jsonMatch[0]);
            if (vendorError.message_code === 'verification_failed') {
              errorMessage = 'Invalid OTP. Please check and try again.';
            } else if (vendorError.message) {
              errorMessage = vendorError.message;
            }
          }
        } catch (parseError) {
          errorMessage = 'OTP verification failed. Please try again.';
        }
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      return {
        status: 'error',
        message: errorMessage,
        statusCode: result?.StatusCode || result?.status_code || 400,
        data: result?.data
      };
    }
    
    // Handle other failure cases
    return {
      status: 'error',
      message: result?.message || 'OTP verification failed',
      statusCode: result?.StatusCode || result?.status_code || 400,
      data: result?.data
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Network error while verifying OTP'
    };
  }
};

// Legacy exports for backward compatibility  
export const sendAadhaarOTP = sendAadhaarOtp;
export const verifyAadhaarOTP = verifyAadhaarOtp;