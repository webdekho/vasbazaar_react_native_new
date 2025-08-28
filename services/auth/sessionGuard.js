import { getSessionToken } from './sessionManager';
import { router } from 'expo-router';

/**
 * Global session guard that checks for valid session token
 * and redirects to PIN validation if not available
 */
export const checkSessionAndRedirect = async () => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      console.log('SessionGuard: No valid session token, redirecting to PIN validation');
      router.replace('/auth/PinValidateScreen');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('SessionGuard: Error checking session:', error);
    router.replace('/auth/PinValidateScreen');
    return false;
  }
};

/**
 * Higher-order function to wrap any function with session check
 */
export const withSessionCheck = (fn) => {
  return async (...args) => {
    const hasValidSession = await checkSessionAndRedirect();
    
    if (hasValidSession) {
      return await fn(...args);
    }
    
    return null;
  };
};

/**
 * Hook to check session on component mount or action
 */
export const useSessionGuard = () => {
  const checkSession = async () => {
    return await checkSessionAndRedirect();
  };
  
  return { checkSession };
};