import axios from 'axios';

export const BASE_URL = 'https://apis.vasbazaar.com';

// Create headers for API requests
const createHeaders = (sessionToken = null) => ({
  'Content-Type': 'application/json',
  ...(sessionToken && { 'access_token': sessionToken }),
});

// Create headers with Authorization Bearer token
const createAuthHeaders = (bearerToken = null) => ({
  'Content-Type': 'application/json',
  ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` }),
});

// Handle API response
const handleResponse = (response) => {
  const responseData = response.data;
  const { Status, STATUS, status, message, data, RDATA, ERROR, ref_id, StatusCode } = responseData;
  
  console.log('baseApi - handleResponse input:', {
    Status, STATUS, status, message, hasData: !!data, hasRDATA: !!RDATA, ERROR, ref_id, StatusCode
  });
  
  if (Status === 'SUCCESS' || STATUS === 'SUCCESS' || status === 'SUCCESS' || status === 'success' || (STATUS === '1' && ERROR === '0') || RDATA) {
    const result = {
      status: 'success',
      data: data || RDATA || responseData,
      message: message || 'Success',
    };
    
    // Include ref_id if present (for OTP APIs)
    if (ref_id) {
      result.ref_id = ref_id;
    }
    
    console.log('baseApi - handleResponse SUCCESS result:', result);
    return result;
  }
  
  // For FAILURE status, pass through all the response data including Status and StatusCode
  const errorResult = {
    status: 'failure',
    Status: Status || STATUS || status,
    StatusCode: StatusCode,
    message: message || 'Something went wrong',
    data: data
  };
  
  console.log('baseApi - handleResponse FAILURE result:', errorResult);
  return errorResult;
};

// Handle API errors
const handleError = (error) => {
  const fallbackMessage = error?.response?.data?.message || 'Network error. Please try again.';
  return {
    status: 'error',
    message: fallbackMessage,
  };
};

// POST request
export const postRequest = async (endpoint, payload, sessionToken = null) => {
  try {
    const headers = createHeaders(sessionToken);
    const fullUrl = `${BASE_URL}/${endpoint}`;
    
    console.log('baseApi - postRequest:', {
      url: fullUrl,
      payload: endpoint.includes('send_otp') ? { aadhaarNumber: payload.aadhaarNumber } : payload,
      hasSessionToken: !!sessionToken,
      headers
    });
    
    const response = await axios.post(fullUrl, payload, { headers });
    
    console.log('baseApi - postRequest response:', {
      status: response.status,
      data: response.data
    });
    
    return handleResponse(response);
  } catch (error) {
    console.log('baseApi - postRequest error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return handleError(error);
  }
};

// GET request
export const getRequest = async (endpoint, params = {}, sessionToken = null) => {
  try {
    const headers = createHeaders(sessionToken);
    const response = await axios.get(`${BASE_URL}/${endpoint}`, { headers, params });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// POST request with Authorization Bearer header
export const postRequestWithAuth = async (endpoint, payload, bearerToken = null) => {
  try {
    const headers = createAuthHeaders(bearerToken);
    const response = await axios.post(`${BASE_URL}/${endpoint}`, payload, { headers });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// GET request with Authorization Bearer header
export const getRequestWithAuth = async (endpoint, params = {}, bearerToken = null) => {
  try {
    const headers = createAuthHeaders(bearerToken);
    const response = await axios.get(`${BASE_URL}/${endpoint}`, { headers, params });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// File upload
export const uploadMultipartApi = async (endpoint, formData, sessionToken) => {
  try {
    console.log('uploadMultipartApi called');
    console.log('Endpoint:', endpoint);
    console.log('Has sessionToken:', !!sessionToken);
    
    const url = `${BASE_URL}/${endpoint}`;
    console.log('Full URL:', url);
    
    // Try using fetch instead of axios for better FormData support
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'access_token': sessionToken,
          // Don't set Content-Type - let fetch set it with boundary
        },
        body: formData,
      });
      
      console.log('Fetch response status:', response.status);
      const responseData = await response.json();
      console.log('Fetch response data:', responseData);
      
      if (responseData.Status === 'SUCCESS' || responseData.status === 'success') {
        return { 
          success: responseData.message || 'Success',
          Status: responseData.Status,
          data: responseData 
        };
      }
      
      return { 
        fail: responseData.message || 'Upload failed',
        data: responseData 
      };
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      // Fallback to axios if fetch fails
      
      const headers = {
        'Accept': 'application/json',
        ...(sessionToken && { 'access_token': sessionToken }),
      };
      
      const response = await axios.put(url, formData, { headers });
      console.log('Axios response:', response.data);
      
      if (response.data.Status === 'SUCCESS') {
        return { success: response.data.message, data: response.data };
      }
      return { fail: response.data.message || 'Upload failed', data: response.data };
    }
  } catch (error) {
    console.error('Upload API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    return handleError(error);
  }
};

// Legacy exports for backward compatibility
export const getRecords = getRequest;
export const Upload_Multipart_Api = uploadMultipartApi;