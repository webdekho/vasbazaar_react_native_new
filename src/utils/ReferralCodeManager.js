import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_CODE_KEY = 'referralCode';

class ReferralCodeManager {
  // Store referral code
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

  // Retrieve referral code
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

  // Clear referral code (after successful use)
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

  // Extract code from URL (web only)
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

  // Initialize and check for referral code
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