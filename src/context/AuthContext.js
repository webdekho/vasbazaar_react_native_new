import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PropTypes from 'prop-types';

/**
 * Authentication Context
 * Manages user authentication state, tokens, and user data across the app
 */
export const AuthContext = createContext({
  userToken: null,
  userData: null,
  secureToken: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  clearSessionToken: () => {},
  updateUserData: () => {}
});

// Storage keys constants
const STORAGE_KEYS = {
  SESSION: 'SessionTokenVas',
  USER_DATA: 'UserDataVas',
  PERMANENT: 'SecureTokenVas',
};

/**
 * Authentication Provider Component
 * Provides authentication context to child components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Auth provider with context
 */
export const AuthProvider = ({ children }) => {
  const isWeb = Platform.OS === 'web';

  // State management
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [secureToken, setSecureToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Handles user login and stores authentication tokens
   * @param {string} sessionToken - Session authentication token
   * @param {Object} userData - User profile data
   * @param {string} permanentToken - Permanent authentication token
   */
  const login = useCallback(async (sessionToken, userData, permanentToken) => {
    try {
      if (!sessionToken || !permanentToken) {
        console.error('AuthContext: Missing session or permanent token');
        return;
      }

      // Store user data if provided
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUserData(userData);
      }

      // Store permanent token securely
      if (isWeb) {
        await AsyncStorage.setItem(STORAGE_KEYS.PERMANENT, permanentToken);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEYS.PERMANENT, permanentToken);
      }

      setUserToken(sessionToken);
      setSecureToken(permanentToken);
      
      console.log('✅ AuthContext: Login successful');
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
    }
  }, [isWeb]);


  /**
   * Updates user data in storage and state
   * @param {Object} userData - Updated user profile data
   */
  const updateUserData = useCallback(async (userData) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUserData(userData);
        console.log('✅ AuthContext: User data updated');
      }
    } catch (error) {
      console.error('❌ AuthContext: Update user data error:', error);
    }
  }, []);

  /**
   * Handles user logout and clears all stored authentication data
   */
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.SESSION, STORAGE_KEYS.USER_DATA]);

      if (isWeb) {
        await AsyncStorage.removeItem(STORAGE_KEYS.PERMANENT);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.PERMANENT);
      }

      setUserToken(null);
      setSecureToken(null);
      setUserData(null);
      
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    }
  }, [isWeb]);

  /**
   * Clears session token and user data while keeping permanent token
   */
  const clearSessionToken = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.SESSION, STORAGE_KEYS.USER_DATA]);
      setUserToken(null);
      setUserData(null);
      console.log('✅ AuthContext: Session cleared');
    } catch (error) {
      console.error('❌ AuthContext: Clear session error:', error);
    }
  }, []);

  /**
   * Checks for stored tokens and user data on app initialization
   */
  const checkStoredTokens = useCallback(async () => {
    try {
      console.log('🔍 AuthContext: Starting token check...');
      setIsLoading(true);
      
      const userDataRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const userDataParsed = userDataRaw ? JSON.parse(userDataRaw) : null;

      const permanentToken = isWeb
        ? await AsyncStorage.getItem(STORAGE_KEYS.PERMANENT)
        : await SecureStore.getItemAsync(STORAGE_KEYS.PERMANENT);

      console.log('🔍 AuthContext: Token check results:', {
        hasUserData: !!userDataParsed,
        hasPermanentToken: !!permanentToken,
        platform: Platform.OS
      });

      setUserData(userDataParsed);
      setSecureToken(permanentToken);
      
      console.log('✅ AuthContext: Token check completed successfully');
      
    } catch (error) {
      console.error('❌ AuthContext: Token check error:', error);
      // Reset all states on error
      setUserToken(null);
      setUserData(null);
      setSecureToken(null);
    } finally {
      setIsLoading(false);
      console.log('✅ AuthContext: Loading state set to false');
    }
  }, [isWeb]);

  useEffect(() => {
    checkStoredTokens();
  }, []); // Empty dependency array to run only once

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = {
    login,
    logout,
    clearSessionToken,
    userToken,
    userData,
    secureToken,
    updateUserData,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// PropTypes for better type checking
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
