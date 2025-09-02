import { postRequest } from '../api/baseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSessionToken } from './sessionManager';

/**
 * Login using biometric authentication with permanent token
 * @param {string} permanentToken - The permanent token for authentication
 * @returns {Promise<Object>} Login response
 */
export const loginWithBiometric = async (permanentToken) => {
  try {
    
    if (!permanentToken) {
      return {
        status: 'error',
        message: 'No permanent token available'
      };
    }

    // Prepare request details
    const endpoint = 'login/biometric';
    const params = {}; // No body parameters needed


    // Call the biometric login API
    // postRequest(endpoint, payload, sessionToken) - using permanentToken as sessionToken
    const response = await postRequest(
      endpoint,
      params,
      permanentToken // Pass permanent token as sessionToken (becomes access_token header)
    );



    // Handle the response format (Status vs status)
    const isSuccess = response?.Status === 'SUCCESS' || response?.status === 'success';
    
    if (isSuccess && response?.data) {
      const userData = response.data;
      
      // Save the new session token
      if (userData.token) {
        await saveSessionToken(userData.token);
      }
      
      // Save/update user data
      const userDataToStore = {
        name: userData.name,
        mobile: userData.mobile,
        city: userData.city,
        state: userData.state,
        userType: userData.userType,
        verified_status: userData.verified_status,
        pin: userData.pin,
        refferalCode: userData.refferalCode
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(userDataToStore));
      
      // Save profile photo if available
      if (userData.profile) {
        await AsyncStorage.setItem('profile_photo', userData.profile);
      }
      
      
      return {
        status: 'success',
        message: response.message || 'Successfully login',
        data: {
          sessionToken: userData.token,
          userData: userDataToStore
        }
      };
    }

    const errorMessage = response?.message || response?.Message || 'Biometric login failed';
    
    return {
      status: 'error',
      message: errorMessage
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Network error during biometric login'
    };
  }
};

/**
 * Check if biometric login is possible
 * @returns {Promise<boolean>} True if biometric login is available
 */
export const canUseBiometricLogin = async () => {
  try {
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    return !!permanentToken;
  } catch (error) {
    return false;
  }
};