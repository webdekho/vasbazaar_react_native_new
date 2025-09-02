import { getSessionToken } from '../services/auth/sessionManager';
import { router } from 'expo-router';

/**
 * Utility function to wrap any function with session check
 * This can be used as a simple wrapper for onClick handlers
 */
export const withSessionCheck = (callback) => {
  return async (...args) => {
    try {
      const sessionToken = await getSessionToken();
      
      if (!sessionToken) {
        router.replace('/auth/PinValidateScreen');
        return null;
      }
      
      // Session is valid, execute the callback
      return await callback(...args);
    } catch (error) {
      router.replace('/auth/PinValidateScreen');
      return null;
    }
  };
};

/**
 * Simple session check without redirect (returns boolean)
 */
export const hasValidSession = async () => {
  try {
    const sessionToken = await getSessionToken();
    return !!sessionToken;
  } catch (error) {
    return false;
  }
};

/**
 * Session check with automatic redirect
 */
export const validateSessionOrRedirect = async () => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      router.replace('/auth/PinValidateScreen');
      return false;
    }
    
    return true;
  } catch (error) {
    router.replace('/auth/PinValidateScreen');
    return false;
  }
};