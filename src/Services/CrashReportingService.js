import { Platform } from 'react-native';

let crashlytics = null;
let firebase = null;

// Only load Firebase on native platforms
if (Platform.OS !== 'web') {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    firebase = require('@react-native-firebase/app').default;
  } catch (error) {
    console.warn('Firebase modules not available:', error.message);
  }
}

class CrashReportingService {
  /**
   * Initialize crash reporting
   */
  static initialize() {
    try {
      // Check if crashlytics is available
      if (!crashlytics || !firebase) {
        console.warn('Firebase/Crashlytics not available, using mock crash reporting');
        return;
      }

      // Check if Firebase app is initialized
      if (firebase.apps.length === 0) {
        console.warn('Firebase app not initialized yet, skipping crash reporting setup');
        return;
      }

      // Enable crash collection (only for production)
      if (!__DEV__) {
        crashlytics().setCrashlyticsCollectionEnabled(true);
      }
      
      console.log('Crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Log a non-fatal error
   * @param {Error} error - The error to log
   * @param {string} context - Additional context about where the error occurred
   */
  static logError(error, context = '') {
    try {
      if (__DEV__ || !crashlytics) {
        console.error('Error logged:', error, context);
        return;
      }

      // Add custom attributes for better debugging
      if (context) {
        crashlytics().setAttribute('error_context', context);
      }

      // Log the error to Crashlytics
      crashlytics().recordError(error);
    } catch (e) {
      console.error('Failed to log error to crashlytics:', e);
    }
  }

  /**
   * Log a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} attributes - Custom attributes
   */
  static logEvent(eventName, attributes = {}) {
    try {
      if (__DEV__ || !crashlytics) {
        console.log('Event logged:', eventName, attributes);
        return;
      }

      crashlytics().log(`Event: ${eventName}`);
      
      // Set attributes
      Object.keys(attributes).forEach(key => {
        crashlytics().setAttribute(key, String(attributes[key]));
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Set user identifier for crash reports
   * @param {string} userId - User ID
   * @param {Object} userAttributes - Additional user attributes
   */
  static setUser(userId, userAttributes = {}) {
    try {
      if (__DEV__ || !crashlytics) {
        console.log('User set:', userId, userAttributes);
        return;
      }

      crashlytics().setUserId(userId);
      
      // Set user attributes
      Object.keys(userAttributes).forEach(key => {
        crashlytics().setAttribute(`user_${key}`, String(userAttributes[key]));
      });
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  /**
   * Clear user data
   */
  static clearUser() {
    try {
      if (__DEV__ || !crashlytics) {
        console.log('User cleared');
        return;
      }

      crashlytics().setUserId('');
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  /**
   * Force a crash (for testing purposes only)
   * WARNING: Only use this for testing crash reporting
   */
  static testCrash() {
    if (__DEV__ || !crashlytics) {
      console.warn('Test crash called - only works in production builds');
      return;
    }
    
    crashlytics().crash();
  }
}

export default CrashReportingService;