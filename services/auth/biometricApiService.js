import { postRequest, getRequest } from '../api/baseApi';
import { Platform } from 'react-native';

/**
 * Enable biometric authentication on server
 * @param {string} userId - User identifier
 * @param {string} encryptedPin - Encrypted PIN data
 * @param {string} biometricType - Type of biometric (fingerprint/face_recognition)
 * @param {string} sessionToken - Session token for authentication
 * @returns {Promise<Object>} API response
 */
export const enableBiometricOnServer = async (userId, encryptedPin, biometricType, sessionToken) => {
  try {
    console.log('🔐 Enabling biometric on server for user:', userId);
    
    const response = await postRequest(
      'auth/enable-biometric',
      {
        user_id: userId,
        device_id: `${Platform.OS}_device_${Date.now()}`,
        biometric_type: biometricType.toLowerCase(),
        encrypted_pin: encryptedPin,
        platform: Platform.OS
      },
      sessionToken
    );

    console.log('✅ Enable biometric response:', response);
    return response;

  } catch (error) {
    console.error('❌ Error enabling biometric on server:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to enable biometric authentication'
    };
  }
};

/**
 * Disable biometric authentication on server
 * @param {string} userId - User identifier
 * @param {string} sessionToken - Session token for authentication
 * @returns {Promise<Object>} API response
 */
export const disableBiometricOnServer = async (userId, sessionToken) => {
  try {
    console.log('🔓 Disabling biometric on server for user:', userId);
    
    const response = await postRequest(
      'auth/disable-biometric',
      {
        user_id: userId,
        device_id: `${Platform.OS}_device_${Date.now()}`,
        platform: Platform.OS
      },
      sessionToken
    );

    console.log('✅ Disable biometric response:', response);
    return response;

  } catch (error) {
    console.error('❌ Error disabling biometric on server:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to disable biometric authentication'
    };
  }
};

/**
 * Check biometric status on server
 * @param {string} userId - User identifier
 * @param {string} sessionToken - Session token for authentication
 * @returns {Promise<Object>} API response with biometric status
 */
export const checkBiometricStatusOnServer = async (userId, sessionToken) => {
  try {
    console.log('🔍 Checking biometric status on server for user:', userId);
    
    const response = await getRequest(
      `auth/biometric-status/${userId}`,
      {},
      sessionToken
    );

    console.log('📊 Biometric status response:', response);
    return response;

  } catch (error) {
    console.error('❌ Error checking biometric status:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to check biometric status'
    };
  }
};

/**
 * Sync biometric preferences with server
 * @param {string} userId - User identifier
 * @param {boolean} enabled - Whether biometric is enabled
 * @param {string} sessionToken - Session token for authentication
 * @returns {Promise<Object>} API response
 */
export const syncBiometricPreferences = async (userId, enabled, sessionToken) => {
  try {
    console.log('🔄 Syncing biometric preferences for user:', userId, 'enabled:', enabled);
    
    if (enabled) {
      // If enabling, we need the encrypted PIN - this should be called from setupBiometricAuth
      return {
        status: 'error',
        message: 'Use enableBiometricOnServer for enabling biometric authentication'
      };
    } else {
      // If disabling, use the disable endpoint
      return await disableBiometricOnServer(userId, sessionToken);
    }

  } catch (error) {
    console.error('❌ Error syncing biometric preferences:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to sync biometric preferences'
    };
  }
};