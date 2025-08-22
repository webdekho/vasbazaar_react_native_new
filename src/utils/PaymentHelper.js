/**
 * Payment Helper Utilities
 * 
 * This module provides comprehensive utilities for handling payment operations,
 * including URL validation, payment status detection, and payment gateway integration.
 * It supports both web and mobile platforms with appropriate error handling.
 * 
 * @module PaymentHelper
 * @version 2.0.0
 */

/**
 * Payment status enumeration
 * @readonly
 * @enum {string}
 */
const PAYMENT_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PENDING: 'pending'
};

/**
 * Payment Helper utility object containing payment-related methods
 * @namespace PaymentHelper
 */
export const PaymentHelper = {
  /**
   * Opens a payment URL in a new browser window (web platform only)
   * 
   * @deprecated Use openPaymentWithToken instead for better token-based payments
   * @method openPaymentUrl
   * @param {Object} navigation - React Navigation object (currently unused but kept for compatibility)
   * @param {string} paymentUrl - The payment URL to open
   * @param {Object} [options={}] - Additional options for payment window
   * @param {string} [options.title] - Title for the payment window
   * @throws {Error} Throws error if platform doesn't support window.open or if URL is invalid
   * @example
   * try {
   *   PaymentHelper.openPaymentUrl(navigation, 'https://payment.gateway.com/pay', {
   *     title: 'Payment Gateway'
   *   });
   * } catch (error) {
   *   console.error('Payment failed:', error.message);
   * }
   */
  openPaymentUrl: (navigation, paymentUrl, options = {}) => {
    if (!paymentUrl || typeof paymentUrl !== 'string') {
      throw new Error('Payment URL is required and must be a string');
    }

    if (!PaymentHelper.isValidPaymentUrl(paymentUrl)) {
      throw new Error('Invalid payment URL provided');
    }

    try {
      // Web platform only - open in new window
      if (typeof window !== 'undefined' && window.open) {
        const paymentWindow = window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (!paymentWindow) {
          throw new Error('Failed to open payment window. Please check your browser popup settings.');
        }
      } else {
        throw new Error('Payment URL opening is only supported on web platform');
      }
    } catch (error) {
      throw new Error(`Failed to open payment URL: ${error.message}`);
    }
  },

  /**
   * Opens payment page with UPI token (deprecated)
   * 
   * @deprecated This function is deprecated as payment is handled directly in Payment.js
   * @method openPaymentWithToken
   * @param {Object} navigation - React Navigation object
   * @param {string} upiToken - The UPI token for payment
   * @param {Object} [options={}] - Additional options
   * @throws {Error} Throws deprecation warning
   * @example
   * // This method is deprecated
   * PaymentHelper.openPaymentWithToken(navigation, 'token123');
   */
  openPaymentWithToken: (navigation, upiToken, options = {}) => {
    if (!upiToken || typeof upiToken !== 'string') {
      throw new Error('UPI token is required and must be a string');
    }

    try {
      throw new Error('PaymentHelper.openPaymentWithToken is deprecated. Payment is handled directly in Payment.js');
    } catch (error) {
      throw new Error(`Payment with token failed: ${error.message}`);
    }
  },

  /**
   * Default payment URL for Vasbazaar payment gateway
   * @constant {string}
   * @readonly
   */
  defaultPaymentUrl: 'https://apis.vasbazaar.com/failure/443C8B6BA780AFE676383AEF6C18006996FF7E66CB615330EC28CCCB2061190B77EFC1309328312211100C01B6B737B2708F7216EA892CF528C684980F972CAC8D2557540D99B0BFDD509782EC6473D045377C22940C5F1828B8BB8D2F93F636D3529BF6E0E1C1E315C54364FD068B52A97673BC6DB20F5A5CC358AA6829FB1581986DD1D96E37A5727DA71F10ABB78A8D85403652FFDF1A4AE90536487B4AF6613F22346613CDE77C4082143A1D80B5B8E807C85EDA816622BA4493BF1DC18E5B714EE87F49220E51A3E52F8E60A89943999891CD57F8F5E87C537CB224E1B3517FD5CDBB3909F947FFC55F0FB9CD6F40451926FAC3B426EDC2C53895644674932243629D68D32E33F2865904954347',

  /**
   * Opens the default Vasbazaar payment URL
   * 
   * @method openDefaultPayment
   * @param {Object} navigation - React Navigation object
   * @throws {Error} Throws error if default payment URL cannot be opened
   * @example
   * try {
   *   PaymentHelper.openDefaultPayment(navigation);
   * } catch (error) {
   *   console.error('Default payment failed:', error.message);
   * }
   */
  openDefaultPayment: (navigation) => {
    try {
      PaymentHelper.openPaymentUrl(navigation, PaymentHelper.defaultPaymentUrl, {
        title: 'Vasbazaar Payment'
      });
    } catch (error) {
      throw new Error(`Failed to open default payment: ${error.message}`);
    }
  },

  /**
   * Validates if a URL is a valid HTTP/HTTPS payment URL
   * 
   * @method isValidPaymentUrl
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid HTTP/HTTPS, false otherwise
   * @example
   * const isValid = PaymentHelper.isValidPaymentUrl('https://payment.com');
   * if (isValid) {
   *   // Proceed with payment
   * }
   */
  isValidPaymentUrl: (url) => {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (error) {
      return false;
    }
  },

  /**
   * Extracts payment status from a URL by analyzing URL patterns
   * 
   * @method getPaymentStatus
   * @param {string} url - URL to analyze for payment status
   * @returns {'success'|'failure'|'pending'} The detected payment status
   * @example
   * const status = PaymentHelper.getPaymentStatus('https://gateway.com/payment-success');
   * switch (status) {
   *   case 'success': // Handle success; break;
   *   case 'failure': // Handle failure; break;
   *   case 'pending': // Handle pending; break;
   * }
   */
  getPaymentStatus: (url) => {
    if (!url || typeof url !== 'string') {
      return PAYMENT_STATUS.PENDING;
    }
    
    try {
      const lowerUrl = url.toLowerCase();
      
      // Success patterns
      const successPatterns = [
        'success',
        'payment-success',
        'transaction-success',
        'completed',
        'approved',
        'confirmed'
      ];
      
      // Failure patterns
      const failurePatterns = [
        'failure',
        'payment-failed',
        'transaction-failed',
        'error',
        'declined',
        'cancelled',
        'rejected'
      ];
      
      if (successPatterns.some(pattern => lowerUrl.includes(pattern))) {
        return PAYMENT_STATUS.SUCCESS;
      }
      
      if (failurePatterns.some(pattern => lowerUrl.includes(pattern))) {
        return PAYMENT_STATUS.FAILURE;
      }
      
      return PAYMENT_STATUS.PENDING;
    } catch (error) {
      return PAYMENT_STATUS.PENDING;
    }
  },

  /**
   * Payment status constants for consistent status checking
   * @constant {Object}
   * @readonly
   */
  PAYMENT_STATUS
};

export default PaymentHelper;