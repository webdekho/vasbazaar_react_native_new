import { postRequest } from '../api/baseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { saveSessionToken } from './sessionManager';

/**
 * Authenticate using permanent token to get session token
 * @param {string} permanentToken - The permanent token stored on device
 * @returns {Promise<Object>} Authentication response with session token
 */
export const loginWithPermanentToken = async (permanentToken) => {
  try {
    
    if (!permanentToken) {
      return {
        status: 'error',
        message: 'No permanent token provided'
      };
    }

    // Call API to exchange permanent token for session token
    const response = await postRequest(
      'auth/permanent-token-login',
      {
        permanent_token: permanentToken,
        device_id: `${Platform.OS}_device_${Date.now()}`, // Generate device ID
        platform: Platform.OS
      }
    );


    if (response?.status === 'success' && response?.data) {
      const { token: sessionToken, ...userData } = response.data;
      
      // Save the new session token
      if (sessionToken) {
        await saveSessionToken(sessionToken);
      }
      
      // Save/update user data
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
      
      return {
        status: 'success',
        sessionToken,
        userData,
        message: 'Login successful'
      };
    }

    return {
      status: 'error',
      message: response?.message || 'Failed to authenticate with permanent token'
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Network error during authentication'
    };
  }
};

/**
 * Validate if permanent token is still valid
 * @param {string} permanentToken - The permanent token to validate
 * @returns {Promise<boolean>} True if token is valid
 */
export const validatePermanentToken = async (permanentToken) => {
  try {
    if (!permanentToken) return false;
    
    // Call API to validate permanent token
    const response = await postRequest(
      'auth/validate-permanent-token',
      {
        permanent_token: permanentToken
      }
    );
    
    return response?.status === 'success';
  } catch (error) {
    return false;
  }
};

/**
 * Refresh session using permanent token
 * @returns {Promise<Object>} Refresh response
 */
export const refreshSessionWithPermanentToken = async () => {
  try {
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    
    if (!permanentToken) {
      return {
        status: 'error',
        message: 'No permanent token found'
      };
    }
    
    return await loginWithPermanentToken(permanentToken);
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to refresh session'
    };
  }
};

/**
 * Clear permanent token (for logout)
 */
export const clearPermanentToken = async () => {
  try {
    await AsyncStorage.removeItem('permanentToken');
    return true;
  } catch (error) {
    return false;
  }
};