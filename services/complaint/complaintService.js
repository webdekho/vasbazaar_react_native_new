import { getRequest, postRequest } from '../api/baseApi';

/**
 * Get all complaints for a user with pagination
 * @param {number} pageNumber - Page number (0-based)
 * @param {number} pageSize - Number of records per page
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response with complaints
 */
export const getUserComplaints = async (pageNumber = 0, pageSize = 10, sessionToken) => {
  try {
    const endpoint = `api/customer/complaint/getAllUserId?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    
    if (response?.status === 'success' && response?.data) {
      return {
        status: 'success',
        data: response.data,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: {
        records: [],
        totalPages: 0,
        totalRecords: 0
      },
      message: response?.message || 'Failed to fetch complaints'
    };
    
  } catch (error) {
    return {
      status: 'error',
      data: {
        records: [],
        totalPages: 0,
        totalRecords: 0
      },
      message: 'Network error while fetching complaints'
    };
  }
};

/**
 * Submit a new complaint
 * @param {Object} complaintData - Complaint data
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response
 */
export const createComplaint = async (complaintData, sessionToken) => {
  try {
    const endpoint = 'api/customer/complaint/create';
    
    const response = await postRequest(endpoint, complaintData, sessionToken);
    
    
    return response;
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Network error while submitting complaint'
    };
  }
};