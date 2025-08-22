import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_CODE_KEY = 'referralCode';

/**
 * Utility class for managing referral codes across different platforms
 * Provides methods to store, retrieve, and extract referral codes
 */
class ReferralCodeManager {
  /**
   * Store referral code in platform-appropriate storage
   * @param {string} code - The referral code to store
   * @returns {Promise<boolean>} Success status
   */
  static async storeReferralCode(code) {
    try {
      if (Platform.OS === 'web') {
        // Use sessionStorage for web
        window.sessionStorage.setItem(REFERRAL_CODE_KEY, code);
      } else {
        // Use AsyncStorage for mobile
        await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
      }
      console.log('Referral code stored:', code);
      return true;
    } catch (error) {
      console.error('Error storing referral code:', error);
      return false;
    }
  }

  /**
   * Retrieve stored referral code from platform storage
   * @returns {Promise<string|null>} The stored referral code or null
   */
  static async getReferralCode() {
    try {
      if (Platform.OS === 'web') {
        return window.sessionStorage.getItem(REFERRAL_CODE_KEY);
      } else {
        return await AsyncStorage.getItem(REFERRAL_CODE_KEY);
      }
    } catch (error) {
      console.error('Error retrieving referral code:', error);
      return null;
    }
  }

  /**
   * Clear stored referral code from platform storage
   * @returns {Promise<boolean>} Success status
   */
  static async clearReferralCode() {
    try {
      if (Platform.OS === 'web') {
        window.sessionStorage.removeItem(REFERRAL_CODE_KEY);
      } else {
        await AsyncStorage.removeItem(REFERRAL_CODE_KEY);
      }
      console.log('Referral code cleared');
      return true;
    } catch (error) {
      console.error('Error clearing referral code:', error);
      return false;
    }
  }

  /**
   * Extract referral code from URL query parameters (web only)
   * Automatically cleans the URL after extraction
   * @returns {string|null} The extracted referral code or null
   */
  static extractFromURL() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          // Clean the URL without reloading
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return code;
        }
      } catch (error) {
        console.error('Error extracting referral code from URL:', error);
      }
    }
    return null;
  }

  /**
   * Initialize referral code manager and check for existing codes
   * Checks URL first (web), then stored codes
   * @returns {Promise<string|null>} The found referral code or null
   */
  static async initialize() {
    // First check URL (web only)
    const urlCode = this.extractFromURL();
    if (urlCode) {
      await this.storeReferralCode(urlCode);
      return urlCode;
    }

    // Then check stored code
    const storedCode = await this.getReferralCode();
    return storedCode;
  }
}

export default ReferralCodeManager;