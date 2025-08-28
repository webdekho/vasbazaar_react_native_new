import { getRequest, postRequest } from '../api/baseApi';

/**
 * Get transaction history with pagination
 * @param {number} pageNumber - Page number (default 0)
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with transaction history
 */
export const getTransactionHistory = async (pageNumber = 0, sessionToken) => {
  try {
    const endpoint = `api/customer/transaction/getByUserId`;
    const params = { pageNumber };
    
    console.log('Fetching transaction history:', { endpoint, pageNumber, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, params, sessionToken);
    
    console.log('Transaction history API response:', response);
    
    if (response?.status === 'success' && response?.data) {
      const { records, totalPages, currentPage, totalRecords } = response.data;
      
      // Transform API data to match component expectations
      const transformedTransactions = records.map(transaction => ({
        id: transaction.txnId,
        txnId: transaction.txnId,
        operatorNo: transaction.operatorNo,
        customerName: transaction.customerName,
        txnAmt: transaction.txnAmt,
        date: transaction.date,
        time: transaction.time,
        status: transaction.status,
        serviceType: transaction.serviceType,
        couponCode: transaction.couponCode,
        discription: transaction.discription || transaction.description,
        hasComplaint: transaction.hasComplaint || false,
        operatorId: {
          ...transaction.operatorId,
          name: transaction.operatorId?.operatorName || 'Unknown',
          operatorName: transaction.operatorId?.operatorName || 'Unknown',
          logo: transaction.operatorId?.logo || 'https://via.placeholder.com/40',
          serviceId: transaction.operatorId?.serviceId ? {
            ...transaction.operatorId.serviceId,
            serviceName: transaction.operatorId.serviceId.serviceName || transaction.serviceType
          } : null
        },
        originalData: transaction
      }));
      
      return {
        status: 'success',
        data: {
          records: transformedTransactions,
          totalPages,
          currentPage,
          totalRecords
        },
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: {
        records: [],
        totalPages: 0,
        currentPage: 0,
        totalRecords: 0
      },
      message: response?.message || 'Failed to fetch transaction history'
    };
    
  } catch (error) {
    console.error('Transaction history API error:', error);
    return {
      status: 'error',
      data: {
        records: [],
        totalPages: 0,
        currentPage: 0,
        totalRecords: 0
      },
      message: 'Network error while fetching transaction history'
    };
  }
};

/**
 * Submit complaint for a transaction
 * @param {string} txnId - Transaction ID
 * @param {string} description - Complaint description
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response
 */
export const submitComplaint = async (txnId, description, sessionToken) => {
  try {
    const endpoint = 'api/customer/complaint/addComplaint';
    const payload = {
      txnId,
      description: description || 'No description provided'
    };
    
    console.log('Submitting complaint:', { endpoint, txnId, hasDescription: !!description });
    
    const response = await postRequest(endpoint, payload, sessionToken);
    
    console.log('Complaint submission response:', response);
    
    if (response?.status === 'success') {
      return {
        status: 'success',
        message: response.message || 'Complaint submitted successfully',
        data: response.data
      };
    }
    
    return {
      status: 'error',
      message: response?.message || 'Failed to submit complaint'
    };
    
  } catch (error) {
    console.error('Complaint submission error:', error);
    return {
      status: 'error',
      message: 'Network error while submitting complaint'
    };
  }
};

/**
 * Get transaction details by ID
 * @param {string} txnId - Transaction ID
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response with transaction details
 */
export const getTransactionDetails = async (txnId, sessionToken) => {
  try {
    const endpoint = `api/customer/transaction/getById`;
    const params = { txnId };
    
    console.log('Fetching transaction details:', { endpoint, txnId });
    
    const response = await getRequest(endpoint, params, sessionToken);
    
    if (response?.status === 'success' && response?.data) {
      return {
        status: 'success',
        data: response.data,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: null,
      message: response?.message || 'Failed to fetch transaction details'
    };
    
  } catch (error) {
    console.error('Transaction details API error:', error);
    return {
      status: 'error',
      data: null,
      message: 'Network error while fetching transaction details'
    };
  }
};