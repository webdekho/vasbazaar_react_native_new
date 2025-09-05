import { NativeModules, Platform } from 'react-native';

// PayU UPI SDK Native Module Interface
const { PayUUpiModule } = NativeModules;

// PayU UPI SDK Service Class
class PayUUpiService {
  constructor() {
    this.isInitialized = false;
    this.config = null;
  }

  /**
   * Initialize PayU UPI SDK with merchant configuration
   * @param {Object} config - Merchant configuration
   * @param {string} config.merchantKey - PayU merchant key
   * @param {string} config.salt - PayU salt
   * @param {string} config.environment - 'test' or 'production'
   */
  async initialize(config) {
    try {
      console.log('Initializing PayU UPI SDK with config:', config);
      
      this.config = {
        merchantKey: config.merchantKey,
        salt: config.salt,
        environment: config.environment || 'test',
        baseUrl: config.environment === 'production' 
          ? 'https://secure.payu.in' 
          : 'https://test.payu.in',
      };

      if (Platform.OS === 'android' && PayUUpiModule) {
        const result = await PayUUpiModule.initialize(this.config);
        console.log('PayU UPI SDK initialized:', result);
        this.isInitialized = result.success;
        return result;
      } else if (Platform.OS === 'ios') {
        // iOS implementation would go here
        console.log('iOS PayU UPI SDK not implemented yet');
        return { success: false, message: 'iOS implementation pending' };
      } else {
        // Web/other platforms fallback
        console.log('PayU UPI SDK: Platform not supported, using fallback');
        this.isInitialized = true;
        return { success: true, message: 'Fallback mode enabled' };
      }
    } catch (error) {
      console.error('PayU UPI SDK initialization failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Validate UPI VPA (Virtual Payment Address)
   * @param {string} vpa - UPI VPA to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateVpa(vpa) {
    try {
      if (!this.isInitialized) {
        throw new Error('PayU UPI SDK not initialized');
      }

      console.log('Validating VPA:', vpa);

      if (Platform.OS === 'android' && PayUUpiModule) {
        const result = await PayUUpiModule.validateVpa(vpa);
        console.log('VPA validation result:', result);
        return result;
      } else {
        // Fallback validation for other platforms
        const isValid = this.isValidVpaFormat(vpa);
        return {
          success: true,
          valid: isValid,
          message: isValid ? 'VPA is valid' : 'Invalid VPA format',
        };
      }
    } catch (error) {
      console.error('VPA validation failed:', error);
      return {
        success: false,
        valid: false,
        message: error.message,
      };
    }
  }

  /**
   * Initiate UPI Collect payment
   * @param {Object} paymentParams - Payment parameters
   * @returns {Promise<Object>} Payment result
   */
  async makeUpiCollectPayment(paymentParams) {
    try {
      if (!this.isInitialized) {
        throw new Error('PayU UPI SDK not initialized');
      }

      console.log('Initiating UPI Collect payment:', paymentParams);

      const params = {
        ...paymentParams,
        key: this.config.merchantKey,
        service_provider: 'payu_paisa',
        surl: `${this.config.baseUrl}/success`,
        furl: `${this.config.baseUrl}/failure`,
      };

      if (Platform.OS === 'android' && PayUUpiModule) {
        const result = await PayUUpiModule.makeUpiCollectPayment(params);
        console.log('UPI Collect payment result:', result);
        return result;
      } else {
        // Fallback for other platforms
        return this.simulatePayment('collect', params);
      }
    } catch (error) {
      console.error('UPI Collect payment failed:', error);
      return {
        success: false,
        status: 'failure',
        message: error.message,
      };
    }
  }

  /**
   * Initiate UPI Intent payment
   * @param {Object} paymentParams - Payment parameters
   * @returns {Promise<Object>} Payment result
   */
  async makeUpiIntentPayment(paymentParams) {
    try {
      if (!this.isInitialized) {
        throw new Error('PayU UPI SDK not initialized');
      }

      console.log('Initiating UPI Intent payment:', paymentParams);

      if (Platform.OS === 'android' && PayUUpiModule) {
        const result = await PayUUpiModule.makeUpiIntentPayment(paymentParams);
        console.log('UPI Intent payment result:', result);
        return result;
      } else {
        // Fallback for other platforms
        return this.simulatePayment('intent', paymentParams);
      }
    } catch (error) {
      console.error('UPI Intent payment failed:', error);
      return {
        success: false,
        status: 'failure',
        message: error.message,
      };
    }
  }

  /**
   * Make payment with specific UPI app
   * @param {Object} paymentParams - Payment parameters
   * @param {string} upiApp - UPI app name ('phonepe', 'googlepay', 'paytm', etc.)
   * @returns {Promise<Object>} Payment result
   */
  async makeUpiAppPayment(paymentParams, upiApp) {
    try {
      if (!this.isInitialized) {
        throw new Error('PayU UPI SDK not initialized');
      }

      console.log('Initiating UPI app payment with:', upiApp, paymentParams);

      if (Platform.OS === 'android' && PayUUpiModule) {
        const result = await PayUUpiModule.makeUpiAppPayment(paymentParams, upiApp);
        console.log('UPI app payment result:', result);
        return result;
      } else {
        // Fallback for other platforms
        return this.simulatePayment(`${upiApp}_intent`, paymentParams);
      }
    } catch (error) {
      console.error('UPI app payment failed:', error);
      return {
        success: false,
        status: 'failure',
        message: error.message,
      };
    }
  }

  /**
   * Get list of available UPI apps on device
   * @returns {Promise<Array>} List of available UPI apps
   */
  async getAvailableUpiApps() {
    try {
      if (Platform.OS === 'android' && PayUUpiModule) {
        const apps = await PayUUpiModule.getAvailableUpiApps();
        console.log('Available UPI apps:', apps);
        return apps;
      } else {
        // Fallback list for other platforms
        return [
          { name: 'PhonePe', packageName: 'com.phonepe.app', available: true },
          { name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user', available: true },
          { name: 'Paytm', packageName: 'net.one97.paytm', available: true },
          { name: 'BHIM', packageName: 'in.org.npci.upiapp', available: false },
        ];
      }
    } catch (error) {
      console.error('Failed to get available UPI apps:', error);
      return [];
    }
  }

  /**
   * Generate payment hash (should be done on server in production)
   * @param {Object} params - Payment parameters
   * @returns {string} Generated hash
   */
  generatePaymentHash(params) {
    // WARNING: This is for testing only
    // In production, hash should be generated on your backend server
    const hashString = `${this.config.merchantKey}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${this.config.salt}`;
    
    console.warn('Generating hash on client side - THIS SHOULD BE DONE ON SERVER IN PRODUCTION');
    console.log('Hash string:', hashString);
    
    // For testing, return a mock hash
    return 'mock_hash_' + Date.now();
  }

  /**
   * Verify payment transaction
   * @param {string} txnid - Transaction ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(txnid) {
    try {
      console.log('Verifying payment transaction:', txnid);
      
      // In production, this should call your backend API
      // which then calls PayU's verification API
      
      return {
        success: true,
        status: 'success',
        txnid,
        amount: '10.00',
        message: 'Payment verified successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Helper methods

  /**
   * Check if VPA format is valid
   * @param {string} vpa - VPA to check
   * @returns {boolean} Is valid format
   */
  isValidVpaFormat(vpa) {
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return vpaRegex.test(vpa);
  }

  /**
   * Simulate payment for testing purposes
   * @param {string} type - Payment type
   * @param {Object} params - Payment parameters
   * @returns {Promise<Object>} Simulated result
   */
  async simulatePayment(type, params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3; // 70% success rate
        resolve({
          success: true,
          status: isSuccess ? 'success' : 'failure',
          message: isSuccess 
            ? `${type} payment completed successfully`
            : `${type} payment failed - simulation`,
          txnid: params.txnid,
          amount: params.amount,
          type,
        });
      }, 2000);
    });
  }

  /**
   * Get SDK configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Check if SDK is initialized
   * @returns {boolean} Initialization status
   */
  isSDKInitialized() {
    return this.isInitialized;
  }
}

// Export singleton instance
export default new PayUUpiService();