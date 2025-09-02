import { getSessionToken } from '../services/auth/sessionManager';
import { router } from 'expo-router';

/**
 * Simple utility function to check session and redirect if needed
 * Returns true if session is valid, false if redirected
 */
export const checkSessionOrRedirect = async () => {
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

/**
 * Wrap any function with session check
 */
export const withSession = (fn) => {
  return async (...args) => {
    const isValid = await checkSessionOrRedirect();
    if (isValid && typeof fn === 'function') {
      return await fn(...args);
    }
    return null;
  };
};