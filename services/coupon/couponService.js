import { postRequest } from '../api/baseApi';
import { getSessionToken } from '../auth/sessionManager';

/**
 * Fetch available coupons
 * @param {string} service_id - Service ID
 * @param {number} amount - Transaction amount
 * @returns {Promise<{status: string, data: array, message: string}>}
 */
export const getCoupons = async (service_id, amount) => {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      return { status: 'error', message: 'No session token available' };
    }

    const payload = {
      service_id,
      amount: amount.toString()
    };

    const response = await postRequest('coupon/list', payload, sessionToken);
    
    if (response.status === 'success' && response.data?.RDATA) {
      // Transform the response data to match expected format
      const coupons = Array.isArray(response.data.RDATA) ? response.data.RDATA : [];
      
      return {
        status: 'success',
        data: coupons.map(coupon => ({
          coupon_id: coupon.coupon_id || coupon.id,
          coupon_code: coupon.coupon_code || coupon.code,
          coupon_name: coupon.coupon_name || coupon.name,
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'fixed',
          discount_value: parseFloat(coupon.discount_value || 0),
          min_amount: parseFloat(coupon.min_amount || 0),
          max_discount: parseFloat(coupon.max_discount || 0),
          valid_till: coupon.valid_till || '',
          terms: coupon.terms || ''
        })),
        message: response.message || 'Coupons fetched successfully'
      };
    }
    
    return {
      status: 'failure',
      data: [],
      message: response.message || 'No coupons available'
    };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return {
      status: 'error',
      data: [],
      message: 'Failed to fetch coupons'
    };
  }
};

/**
 * Apply coupon to transaction
 * @param {string} coupon_code - Coupon code to apply
 * @param {string} service_id - Service ID
 * @param {number} amount - Transaction amount
 * @returns {Promise<{status: string, data: object, message: string}>}
 */
export const applyCoupon = async (coupon_code, service_id, amount) => {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      return { status: 'error', message: 'No session token available' };
    }

    const payload = {
      coupon_code,
      service_id,
      amount: amount.toString()
    };

    const response = await postRequest('coupon/apply', payload, sessionToken);
    
    if (response.status === 'success' && response.data) {
      return {
        status: 'success',
        data: {
          discount_amount: parseFloat(response.data.discount_amount || 0),
          final_amount: parseFloat(response.data.final_amount || amount),
          coupon_details: response.data.coupon_details || {}
        },
        message: response.message || 'Coupon applied successfully'
      };
    }
    
    return {
      status: 'failure',
      data: null,
      message: response.message || 'Failed to apply coupon'
    };
  } catch (error) {
    console.error('Error applying coupon:', error);
    return {
      status: 'error',
      data: null,
      message: 'Failed to apply coupon'
    };
  }
};