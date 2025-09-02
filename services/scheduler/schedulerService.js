import { getRequest } from '../api/baseApi';

/**
 * Get upcoming dues/scheduler suggestions
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with upcoming dues
 */
export const getUpcomingDues = async (sessionToken) => {
  try {
    const endpoint = 'api/customer/schedular/getAllRecharges';
    // console.log('Fetching upcoming dues:', { endpoint, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    // console.log('Upcoming dues API response:', response);
    
    if (response?.status === 'success' && response?.data) {
      // Transform API data to match component expectations
      const transformedDues = response.data.map(due => ({
        id: `due-${due.operatorId?.id || Date.now()}`,
        fromDate: due.fromDate,
        mobile: due.mobile,
        name: due.name,
        param: due.param,
        operator: {
          id: due.operatorId?.id,
          name: due.operatorId?.operatorName,
          code: due.operatorId?.operatorCode,
          logo: due.operatorId?.logo,
          inputFields: due.operatorId?.inputFields
        },
        service: {
          id: due.operatorId?.serviceId?.id,
          name: due.operatorId?.serviceId?.serviceName,
          icon: due.operatorId?.serviceId?.icon,
          onScreen: due.operatorId?.serviceId?.onScreen,
          priority: due.operatorId?.serviceId?.priority
        },
        originalData: due // Keep original data for reference
      }));
      
      return {
        status: 'success',
        data: transformedDues,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: [],
      message: response?.message || 'Failed to fetch upcoming dues'
    };
    
  } catch (error) {
    console.error('Upcoming dues API error:', error);
    return {
      status: 'error',
      data: [],
      message: 'Network error while fetching upcoming dues'
    };
  }
};

/**
 * Get scheduler suggestions (alias for getUpcomingDues)
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with scheduler suggestions
 */
export const getSchedulerSuggestions = async (sessionToken) => {
  return await getUpcomingDues(sessionToken);
};