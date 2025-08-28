import { getRequest } from '../api/baseApi';

/**
 * Get all services with display filter
 * @param {number} displayOnScreen - Filter for services to display on screen (1 for display, 0 for hidden)
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with services
 */
export const getAllServices = async (displayOnScreen = 1, sessionToken) => {
  try {
    const endpoint = `api/customer/service/allService?displayOnScreen=${displayOnScreen}`;
    console.log('Fetching services:', { endpoint, displayOnScreen, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    console.log('Services API response:', response);
    
    if (response?.status === 'success' && response?.data) {
      // Sort services by priority (ascending order)
      const sortedServices = response.data.sort((a, b) => a.priority - b.priority);
      
      // Transform API data to match component expectations
      const transformedServices = sortedServices.map(service => ({
        id: service.id,
        name: service.serviceName,
        icon: { uri: service.icon }, // Remote icon URI
        onScreen: service.onScreen,
        priority: service.priority,
        originalData: service // Keep original data for reference
      }));
      
      return {
        status: 'success',
        data: transformedServices,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: [],
      message: response?.message || 'Failed to fetch services'
    };
    
  } catch (error) {
    console.error('Services API error:', error);
    return {
      status: 'error',
      data: [],
      message: 'Network error while fetching services'
    };
  }
};

/**
 * Get services for home screen display
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with home services
 */
export const getHomeServices = async (sessionToken) => {
  return await getAllServices(1, sessionToken);
};

/**
 * Get all services without display filter (for AllServicesScreen)
 * @param {string} sessionToken - User's session token (used as access_token in header)  
 * @returns {Promise} API response with all services
 */
export const getAllServicesForScreen = async (sessionToken) => {
  try {
    // Try different endpoint approaches to get all services
    const endpoint = 'api/customer/service/allService';
    const params = {}; // No displayOnScreen filter to get ALL services
    console.log('Fetching all services for AllServicesScreen:', { endpoint, params, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    console.log('All services API response:', response);
    
    // Check for various response success formats
    const isSuccess = response?.status === 'success' || 
                     response?.Status === 'SUCCESS' || 
                     response?.success === true;
    
    if (isSuccess && response?.data && Array.isArray(response.data)) {
      console.log('Services found:', response.data.length);
      
      // Sort services by priority (ascending order)
      const sortedServices = response.data.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      
      // Transform API data to match AllServicesScreen component expectations
      const transformedServices = sortedServices.map((service, index) => ({
        id: service.id?.toString() || `service-${index}`,
        title: service.serviceName || service.name || 'Unknown Service',
        icon: service.icon || 'https://via.placeholder.com/48', // Fallback icon
        route: `/main/${(service.serviceName || service.name || '').toLowerCase().replace(/\s+/g, '')}`,
        color: getServiceColor(index), // Assign colors based on index
        description: getServiceDescription(service.serviceName || service.name),
        onScreen: service.onScreen,
        priority: service.priority || 0,
        originalData: service
      }));
      
      console.log('Transformed services:', transformedServices.length);
      
      return {
        status: 'success',
        data: transformedServices,
        message: response.message || 'Services loaded successfully'
      };
    }
    
    console.log('Services API failed - Response details:', {
      hasResponse: !!response,
      status: response?.status,
      Status: response?.Status,
      success: response?.success,
      hasData: !!response?.data,
      dataIsArray: Array.isArray(response?.data),
      dataLength: response?.data?.length,
      fullResponse: response
    });
    
    return {
      status: 'error',
      data: [],
      message: response?.message || 'Failed to fetch all services - check console for details'
    };
    
  } catch (error) {
    console.error('All services API error:', error);
    return {
      status: 'error',
      data: [],
      message: 'Network error while fetching all services'
    };
  }
};

/**
 * Helper function to assign colors to services based on index
 */
const getServiceColor = (index) => {
  const colors = [
    '#4F46E5', '#0EA5E9', '#DC2626', '#F59E0B', 
    '#059669', '#EF4444', '#8B5CF6', '#10B981',
    '#6366F1', '#EA580C', '#BE123C', '#7C3AED',
    '#0891B2', '#16A34A', '#DB2777', '#9333EA'
  ];
  return colors[index % colors.length];
};

/**
 * Helper function to generate descriptions for services
 */
const getServiceDescription = (serviceName) => {
  const descriptions = {
    'Postpaid': 'Pay your postpaid bills',
    'Prepaid': 'Mobile recharge',
    'DTH': 'DTH recharge', 
    'Electricity': 'Electricity bill payment',
    'Gas': 'Gas bill payment',
    'Gas Cylinder': 'Book gas cylinder',
    'Fast Tag': 'FASTag recharge',
    'Landline': 'Landline bill payment',
    'Credit Card': 'Credit card bill payment',
    'Recurring Deposit': 'RD payment',
    'Donation': 'Make donations',
    'Insurance': 'Insurance premium payment',
    'Loan Repayment': 'Loan EMI payment',
    'Prepaid Meter': 'Prepaid meter recharge',
    'Rent': 'House rent payment',
    'Municipal Taxes': 'Municipal tax payment'
  };
  
  return descriptions[serviceName] || `${serviceName} service`;
};

/**
 * Get all services (including hidden ones) - legacy function
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with all services
 */
export const getAllServicesIncludingHidden = async (sessionToken) => {
  return await getAllServicesForScreen(sessionToken);
};