import { getRequest, postRequest } from '../api/baseApi';

/**
 * Get wallet transaction history with pagination
 * @param {Object} params - Request parameters
 * @param {number} params.page - Page number (0-based)
 * @param {string} sessionToken - User's session token
 * @param {string} endpoint - API endpoint (optional, defaults to wallet transaction endpoint)
 * @returns {Promise} API response with wallet transaction history
 */
export const getWalletTransactions = async (params = {}, sessionToken, endpoint = 'api/customer/wallet_transaction/getAll') => {
  try {
    
    const response = await getRequest(endpoint, params, sessionToken);
    
    
    if (response?.status === "success" || response?.Status === "SUCCESS") {
      const { records = [], totalPages = 1 } = response.data || {};

      // Transform API data to match component expectations
      const transformedTransactions = records.map(transaction => ({
        id: transaction.id || transaction.txnId,
        txnId: transaction.txnId,
        operatorNo: transaction.operatorNo,
        txnAmt: transaction.txnAmt,
        date: transaction.date,
        time: transaction.time,
        status: transaction.status,
        serviceType: transaction.serviceType,
        message: transaction.message || transaction.discription || transaction.description,
        txnMode: transaction.txnMode, // 1 for debit, 0 for credit
        openingBal: transaction.openingBal,
        closingBal: transaction.closingBal,
        operatorId: {
          ...transaction.operatorId,
          operatorName: transaction.operatorId?.operatorName || 'Unknown',
          logo: transaction.operatorId?.logo || null
        },
        originalData: transaction
      }));
      
      return {
        status: 'success',
        data: {
          records: transformedTransactions,
          totalPages,
          currentPage: params.page || 0,
          totalRecords: transformedTransactions.length
        },
        message: response.message || 'Success'
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
      message: response?.message || 'Failed to fetch wallet transactions'
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
      message: 'Network error while fetching wallet transactions'
    };
  }
};

/**
 * Get wallet balance
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response with wallet balance
 */
export const getWalletBalance = async (sessionToken) => {
  try {
    const response = await getRequest('api/customer/user/getByUserId', {}, sessionToken);
    
    if (response?.status === "success" || response?.Status === "SUCCESS") {
      // Extract balance from the user data response
      const balance = response.data?.balance || 0;
      
      return {
        status: 'success',
        data: {
          balance: balance
        },
        message: response.message || 'Success'
      };
    }
    
    return {
      status: 'error',
      data: { balance: 0 },
      message: response?.message || 'Failed to fetch wallet balance'
    };
    
  } catch (error) {
    return {
      status: 'error',
      data: { balance: 0 },
      message: 'Network error while fetching wallet balance'
    };
  }
};

/**
 * Get wallet transaction details by ID
 * @param {string} txnId - Transaction ID
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response with transaction details
 */
export const getWalletTransactionDetails = async (txnId, sessionToken) => {
  try {
    const endpoint = `api/customer/wallet_transaction/getById`;
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
      message: response?.message || 'Failed to fetch wallet transaction details'
    };
    
  } catch (error) {
    return {
      status: 'error',
      data: null,
      message: 'Network error while fetching wallet transaction details'
    };
  }
};

/**
 * Add money to wallet
 * @param {number} amount - Amount to add
 * @param {string} paymentMethod - Payment method
 * @param {string} sessionToken - User's session token
 * @returns {Promise} API response
 */
export const addMoneyToWallet = async (amount, paymentMethod, sessionToken) => {
  try {
    const endpoint = 'api/customer/wallet/addMoney';
    const payload = {
      amount,
      paymentMethod
    };
    
    
    const response = await postRequest(endpoint, payload, sessionToken);
    
    if (response?.status === 'success') {
      return {
        status: 'success',
        message: response.message || 'Money added successfully',
        data: response.data
      };
    }
    
    return {
      status: 'error',
      message: response?.message || 'Failed to add money to wallet'
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Network error while adding money to wallet'
    };
  }
};

// Export functions with different naming for compatibility
export const getWalletRecords = getWalletTransactions;