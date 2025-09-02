import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithPermanentToken } from './permanentTokenService';
import { isBiometricAuthAvailable, biometricLogin } from './biometricService';
import { getSessionToken } from './sessionManager';

/**
 * Complete authentication flow manager
 * Handles permanent token, biometric, and session management
 */

/**
 * Initialize app authentication
 * Checks for permanent token and attempts automatic login
 * @returns {Promise<Object>} Authentication result
 */
export const initializeAuth = async () => {
  try {
    console.log('🚀 Initializing authentication flow...');
    
    // Step 1: Check for existing session token
    const existingSession = await getSessionToken();
    if (existingSession) {
      console.log('✅ Valid session token found');
      return {
        status: 'success',
        method: 'existing_session',
        hasSession: true
      };
    }

    // Step 2: Check for permanent token
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    if (!permanentToken) {
      console.log('❌ No permanent token found - need full login');
      return {
        status: 'error',
        method: 'none',
        needsLogin: true,
        message: 'No authentication tokens found'
      };
    }

    // Step 3: Try biometric authentication first (if available)
    const biometricResult = await attemptBiometricAuth();
    if (biometricResult.success) {
      console.log('✅ Biometric authentication successful');
      return {
        status: 'success',
        method: 'biometric',
        ...biometricResult
      };
    }

    // Step 4: Fallback to permanent token login
    console.log('🔑 Attempting permanent token login...');
    const tokenResult = await loginWithPermanentToken(permanentToken);
    if (tokenResult.status === 'success') {
      console.log('✅ Permanent token login successful');
      return {
        status: 'success',
        method: 'permanent_token',
        ...tokenResult
      };
    }

    // Step 5: All methods failed
    console.log('❌ All authentication methods failed');
    return {
      status: 'error',
      method: 'failed',
      needsLogin: true,
      message: 'Authentication failed - please login again'
    };

  } catch (error) {
    console.error('💥 Error in authentication flow:', error);
    return {
      status: 'error',
      method: 'error',
      needsLogin: true,
      message: error.message || 'Authentication error'
    };
  }
};

/**
 * Attempt biometric authentication
 * @returns {Promise<Object>} Biometric authentication result
 */
const attemptBiometricAuth = async () => {
  try {
    // Check if biometric is available and configured
    const availability = await isBiometricAuthAvailable();
    if (!availability.available) {
      return {
        success: false,
        reason: 'Biometric not available',
        canSetup: availability.canSetup
      };
    }

    // Attempt biometric login
    const result = await biometricLogin();
    if (result.success && result.pin) {
      console.log('🔐 Biometric authentication successful');
      
      // TODO: Use the retrieved PIN to get session token
      // This would typically call your PIN validation API
      return {
        success: true,
        pin: result.pin,
        authType: result.authType
      };
    }

    return {
      success: false,
      reason: result.reason || 'Biometric authentication failed'
    };

  } catch (error) {
    console.error('❌ Biometric authentication error:', error);
    return {
      success: false,
      reason: error.message || 'Biometric error'
    };
  }
};

/**
 * Complete logout - clear all authentication data
 * @returns {Promise<boolean>} Success status
 */
export const completeLogout = async () => {
  try {
    console.log('🚪 Performing complete logout...');
    
    // Clear all authentication tokens
    const keysToRemove = [
      'permanentToken',
      'sessionToken',
      'sessionTokenExpiry',
      'userData',
      'aadhaarData',
      'profile_photo',
      // Clear bypass flags
      'pinValidationSuccess',
      'otpValidationSuccess',
      'pinSetSuccess',
      'aadhaarVerificationSuccess'
    ];

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ All authentication data cleared');
    
    return true;
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return false;
  }
};

/**
 * Check if user needs full authentication flow
 * @returns {Promise<boolean>} True if needs full login
 */
export const needsFullAuthentication = async () => {
  try {
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    const sessionToken = await getSessionToken();
    
    return !permanentToken || !sessionToken;
  } catch (error) {
    return true; // If error, assume needs authentication
  }
};

/**
 * Get current authentication status
 * @returns {Promise<Object>} Current auth status
 */
export const getAuthStatus = async () => {
  try {
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    const sessionToken = await getSessionToken();
    const userData = await AsyncStorage.getItem('userData');
    const biometricAvailability = await isBiometricAuthAvailable();

    return {
      hasPermanentToken: !!permanentToken,
      hasSessionToken: !!sessionToken,
      hasUserData: !!userData,
      biometricAvailable: biometricAvailability.available,
      biometricCanSetup: biometricAvailability.canSetup,
      isFullyAuthenticated: !!(permanentToken && sessionToken && userData)
    };
  } catch (error) {
    console.error('Error getting auth status:', error);
    return {
      hasPermanentToken: false,
      hasSessionToken: false,
      hasUserData: false,
      biometricAvailable: false,
      biometricCanSetup: false,
      isFullyAuthenticated: false
    };
  }
};