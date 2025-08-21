/**
 * Payment Helper Utilities
 * Handles payment URL opening and WebView navigation
 */

export const PaymentHelper = {
  /**
   * Opens a payment URL (deprecated - use openPaymentWithToken instead)
   * @param {object} navigation - React Navigation object
   * @param {string} paymentUrl - The payment URL to open
   * @param {object} options - Additional options
   */
  openPaymentUrl: (navigation, paymentUrl, options = {}) => {
    try {
      console.log('Opening payment URL:', paymentUrl);
      
      // Web platform only - open in new window
      if (typeof window !== 'undefined' && window.open) {
        window.open(paymentUrl, '_blank');
      } else {
        console.error('Payment is only supported on web platform');
      }
    } catch (error) {
      console.error('Error opening payment URL:', error);
    }
  },

  /**
   * Opens payment page with UPI token (web platform only)
   * @param {object} navigation - React Navigation object
   * @param {string} upiToken - The UPI token for payment
   * @param {object} options - Additional options
   */
  openPaymentWithToken: (navigation, upiToken, options = {}) => {
    try {
      console.log('Opening payment with UPI token:', upiToken);
      
      // This function is now deprecated as payment is handled directly in Payment.js
      console.warn('PaymentHelper.openPaymentWithToken is deprecated. Payment is handled directly in Payment.js');
    } catch (error) {
      console.error('Error opening payment with token:', error);
    }
  },

  /**
   * Default payment URL (as provided)
   */
  defaultPaymentUrl: 'https://apis.vasbazaar.com/failure/443C8B6BA780AFE676383AEF6C18006996FF7E66CB615330EC28CCCB2061190B77EFC1309328312211100C01B6B737B2708F7216EA892CF528C684980F972CAC8D2557540D99B0BFDD509782EC6473D045377C22940C5F1828B8BB8D2F93F636D3529BF6E0E1C1E315C54364FD068B52A97673BC6DB20F5A5CC358AA6829FB1581986DD1D96E37A5727DA71F10ABB78A8D85403652FFDF1A4AE90536487B4AF6613F22346613CDE77C4082143A1D80B5B8E807C85EDA816622BA4493BF1DC18E5B714EE87F49220E51A3E52F8E60A89943999891CD57F8F5E87C537CB224E1B3517FD5CDBB3909F947FFC55F0FB9CD6F40451926FAC3B426EDC2C53895644674932243629D68D32E33F2865904954347',

  /**
   * Opens the default payment URL
   * @param {object} navigation - React Navigation object
   */
  openDefaultPayment: (navigation) => {
    PaymentHelper.openPaymentUrl(navigation, PaymentHelper.defaultPaymentUrl, {
      title: 'Vasbazaar Payment'
    });
  },

  /**
   * Validates if a URL is a valid payment URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  isValidPaymentUrl: (url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * Extracts payment status from URL
   * @param {string} url - URL to check
   * @returns {string} - 'success', 'failure', or 'pending'
   */
  getPaymentStatus: (url) => {
    if (!url) return 'pending';
    
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('success') || 
        lowerUrl.includes('payment-success') || 
        lowerUrl.includes('transaction-success') ||
        lowerUrl.includes('completed')) {
      return 'success';
    }
    
    if (lowerUrl.includes('failure') || 
        lowerUrl.includes('payment-failed') || 
        lowerUrl.includes('transaction-failed') ||
        lowerUrl.includes('error')) {
      return 'failure';
    }
    
    return 'pending';
  }
};

export default PaymentHelper;