import { useAuth as useAuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionToken } from '../../services/auth/sessionManager';

/**
 * Enhanced useAuth hook that provides authentication state and utilities
 */
export const useAuth = () => {
  const authContext = useAuthContext();
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return authContext;
};

/**
 * Get authentication redirect path based on current state
 */
export const getAuthRedirect = (authState) => {
  if (authState.shouldRedirectToLogin || !authState.isVerified) {
    return '/auth/LoginScreen';
  }
  
  if (authState.needsPinValidation) {
    return '/auth/PinValidateScreen';
  }
  
  if (authState.isAuthenticated && authState.isVerified) {
    return '/(tabs)/home';
  }
  
  return '/auth/LoginScreen';
};

/**
 * Check if user needs PIN validation
 */
export const checkPinValidationNeeded = async () => {
  try {
    const sessionToken = await getSessionToken();
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    
    // Need PIN validation if we have permanent token but no session token
    return !!permanentToken && !sessionToken;
  } catch (error) {
    console.error('Error checking PIN validation:', error);
    return false;
  }
};

/**
 * Check if user should redirect to login
 */
export const checkShouldRedirectToLogin = async () => {
  try {
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    return !permanentToken;
  } catch (error) {
    console.error('Error checking login redirect:', error);
    return true;
  }
};