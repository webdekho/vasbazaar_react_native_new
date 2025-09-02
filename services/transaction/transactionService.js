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
    
    
    const response = await getRequest(endpoint, params, sessionToken);
    
    
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
 * Submit complaint for a transaction or check complaint status
 * @param {string} txnId - Transaction ID
 * @param {string} description - Complaint description (empty for status check)
 * @param {string} sessionToken - User's session token
 * @param {string} action - Action to perform ('check' or 'add')
 * @returns {Promise} API response
 */
export const submitComplaint = async (txnId, description, sessionToken, action = 'add') => {
  try {
    const endpoint = 'api/customer/complaint/addComplaint';
    const payload = {
      txnId,
      description: action === 'check' ? '' : (description || 'No description provided'),
      action
    };
    
    
    const response = await postRequest(endpoint, payload, sessionToken);
    
    
    if (response?.status === 'success' || response?.Status === 'SUCCESS') {
      if (action === 'check') {
        // For status check, return detailed information
        return {
          status: 'success',
          message: response.message || 'Complaint status checked successfully',
          data: {
            hasComplaint: response.data?.hasComplaint !== false, // Default to true if data.message exists
            complaintDetails: response.data?.complaintDetails || null,
            message: response.data?.message || 'No existing complaint found',
            complaintStatus: response.data?.complaintStatus || null
          }
        };
      } else {
        // For adding complaint - check if there's already a complaint
        const hasExistingComplaint = response.data?.message && 
          (response.data.message.includes('already') || response.data.message.includes('processing'));
        
        return {
          status: 'success',
          message: response.message || 'Complaint submitted successfully',
          data: {
            ...response.data,
            hasExistingComplaint
          }
        };
      }
    }
    
    return {
      status: 'error',
      message: response?.message || `Failed to ${action === 'check' ? 'check complaint status' : 'submit complaint'}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: `Network error while ${action === 'check' ? 'checking complaint status' : 'submitting complaint'}`
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
    return {
      status: 'error',
      data: null,
      message: 'Network error while fetching transaction details'
    };
  }
};

/**
 * Check transaction status for pending transactions
 * @param {string} txnId - Transaction ID to check status for
 * @param {string} sessionToken - User's session token
 * @param {Object} additionalPayload - Additional payload containing field1, viewBillResponse, validity
 * @returns {Promise} API response with transaction status
 */
export const checkTransactionStatus = async (txnId, sessionToken, additionalPayload = {}) => {
  try {
    const endpoint = 'api/customer/plan_recharge/check-status';
    const payload = { 
      txnId,
      ...additionalPayload // Include field1, viewBillResponse, validity if provided
    };
    
    
    const response = await postRequest(endpoint, payload, sessionToken);
    
    
    if (response?.status === 'success' && response?.data) {
      // Transform the response to match expected format
      const { status, message, requestId, referenceId, vendorRefId, commission, categoryId } = response.data;
      
      return {
        status: 'success',
        data: {
          transactionStatus: status, // SUCCESS, FAILED, PENDING
          message: message || 'Status check completed',
          requestId: requestId || txnId,
          referenceId,
          vendorRefId,
          commission: commission || 0,
          categoryId
        },
        message: response.message || 'Status check completed'
      };
    }
    
    // Handle specific failure responses
    if (response?.status === 'failure' || response?.Status === 'FAILURE') {
      return {
        status: 'success', // API call succeeded, but transaction has a status
        data: {
          transactionStatus: 'FAILED',
          message: response.message || 'Transaction failed',
          requestId: txnId,
          referenceId: null,
          vendorRefId: null,
          commission: 0,
          categoryId: null
        },
        message: response.message || 'Transaction status retrieved'
      };
    }
    
    return {
      status: 'error',
      data: null,
      message: response?.message || 'Failed to check transaction status'
    };
    
  } catch (error) {
    return {
      status: 'error',
      data: null,
      message: 'Network error while checking transaction status'
    };
  }
};