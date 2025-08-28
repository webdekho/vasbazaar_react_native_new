import { getRequest } from '../api/baseApi';

/**
 * Get advertisements by status
 * @param {string} status - Status filter (e.g., 'home')
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with advertisements
 */
export const getAdvertisementsByStatus = async (status = 'home', sessionToken) => {
  try {
    const endpoint = `api/customer/advertisement/getByStatus?status=${status}`;
    console.log('Fetching advertisements:', { endpoint, status, hasToken: !!sessionToken });
    
    const response = await getRequest(endpoint, {}, sessionToken);
    
    console.log('Advertisement API response:', response);
    
    if (response?.status === 'success' && response?.data) {
      // Transform API data to match component expectations
      const transformedBanners = response.data.map(ad => ({
        type: "image",
        id: `ad-${ad.id}`,
        image: { uri: ad.banner }, // Remote image URI
        title: ad.title || "vasbzaar Advertisement",
        description: ad.description || "Special offer for vasbzaar customers",
        datetime: ad.datetime,
        screen: ad.screen,
        status: ad.status,
        originalData: ad // Keep original data for reference
      }));
      
      return {
        status: 'success',
        data: transformedBanners,
        message: response.message
      };
    }
    
    return {
      status: 'error',
      data: [],
      message: response?.message || 'Failed to fetch advertisements'
    };
    
  } catch (error) {
    console.error('Advertisement service error:', error);
    return {
      status: 'error',
      data: [],
      message: 'Network error while fetching advertisements'
    };
  }
};

/**
 * Get home screen advertisements
 * @param {string} sessionToken - User's session token (used as access_token in header)
 * @returns {Promise} API response with home advertisements
 */
export const getHomeAdvertisements = async (sessionToken) => {
  return await getAdvertisementsByStatus('home', sessionToken);
};