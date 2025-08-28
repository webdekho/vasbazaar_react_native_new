import { getSessionToken } from '../../services/auth/sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * All-in-one session protection utilities
 * Simple and easy to use without complex imports
 */

/**
 * Check if session is valid, redirect if not
 * Returns true if valid, false if redirected
 */
export const checkSession = async () => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      // Check if we have permanent token to determine redirect
      const permanentToken = await AsyncStorage.getItem('permanentToken');
      
      if (permanentToken) {
        console.log('🔒 Session invalid but permanent token exists - redirecting to PIN validation');
        router.replace('/auth/PinValidateScreen');
      } else {
        console.log('🔒 No session or permanent token - redirecting to login');
        router.replace('/auth/LoginScreen');
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('🔒 Session check error:', error);
    router.replace('/auth/LoginScreen');
    return false;
  }
};

/**
 * Protect any function with session validation
 * Usage: const handleClick = protect(() => doSomething());
 */
export const protect = (fn) => {
  return async (...args) => {
    const isValid = await checkSession();
    if (isValid && typeof fn === 'function') {
      return await fn(...args);
    }
    return null;
  };
};

/**
 * Protect navigation functions specifically
 * Usage: const handleNavigation = protectNavigation('/path');
 */
export const protectNavigation = (path, params = {}) => {
  return protect(() => {
    if (Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  });
};

/**
 * Protect push navigation
 */
export const protectedPush = async (path, params = {}) => {
  const isValid = await checkSession();
  if (isValid) {
    if (Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  }
};

/**
 * Protect replace navigation  
 */
export const protectedReplace = async (path, params = {}) => {
  const isValid = await checkSession();
  if (isValid) {
    if (Object.keys(params).length > 0) {
      router.replace({ pathname: path, params });
    } else {
      router.replace(path);
    }
  }
};

/**
 * Simple session check without redirect (returns boolean)
 */
export const hasValidSession = async () => {
  try {
    const sessionToken = await getSessionToken();
    return !!sessionToken;
  } catch {
    return false;
  }
};

// Export aliases for convenience
export const withSessionCheck = protect;
export const sessionProtect = protect;
export const requireSession = protect;