import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getSessionToken } from '../../services/auth/sessionManager';

/**
 * Hook that provides session checking functionality
 * Can be used to check session on component mount or before actions
 */
export const useSessionCheck = (checkOnMount = false) => {
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const sessionToken = await getSessionToken();
      
      if (!sessionToken) {
        console.log('useSessionCheck: No valid session token, redirecting to PIN validation');
        router.replace('/auth/PinValidateScreen');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('useSessionCheck: Error checking session:', error);
      router.replace('/auth/PinValidateScreen');
      return false;
    }
  }, [router]);

  // Check session on component mount if requested
  useEffect(() => {
    if (checkOnMount) {
      checkSession();
    }
  }, [checkOnMount, checkSession]);

  return checkSession;
};

/**
 * Hook that wraps any async function with session check
 */
export const useProtectedAction = () => {
  const checkSession = useSessionCheck();

  const executeWithSessionCheck = useCallback(async (action) => {
    const hasValidSession = await checkSession();
    
    if (hasValidSession && typeof action === 'function') {
      return await action();
    }
    
    return null;
  }, [checkSession]);

  return executeWithSessionCheck;
};