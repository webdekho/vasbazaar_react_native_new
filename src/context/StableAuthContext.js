import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isWeb = Platform.OS === 'web';

  const STORAGE_SESSION_KEY = 'SessionTokenVas';
  const STORAGE_USER_DATA = 'UserDataVas';
  const STORAGE_PERMANENT_KEY = 'SecureTokenVas';

  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [secureToken, setSecureToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedTokens, setHasCheckedTokens] = useState(false);

  console.log('🔄 StableAuthContext: Rendering...', { isLoading, hasCheckedTokens });

  // 🔐 Login: Save session and secure token
  const login = async (sessionToken, userData, permanentToken) => {
    try {
      if (!sessionToken || !permanentToken) {
        console.error('Missing session or permanent token');
        return;
      }

      if(userData !== null){
        await AsyncStorage.setItem(STORAGE_USER_DATA, JSON.stringify(userData));
      }

      if (isWeb) {
        await AsyncStorage.setItem(STORAGE_PERMANENT_KEY, permanentToken);
      } else {
        await SecureStore.setItemAsync(STORAGE_PERMANENT_KEY, permanentToken);
      }

      setUserToken(sessionToken);
      if(userData !== null){
        setUserData(userData);
      }
      setSecureToken(permanentToken);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const updateUserData = async (userData) => {
    try {
      if(userData !== null){
        await AsyncStorage.setItem(STORAGE_USER_DATA, JSON.stringify(userData));
        setUserData(userData);
      }
    } catch (error) {
      console.error('Only User Data error:', error);
    }
  };

  // 🚪 Logout: Clear everything
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_SESSION_KEY, STORAGE_USER_DATA]);

      if (isWeb) {
        await AsyncStorage.removeItem(STORAGE_PERMANENT_KEY);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_PERMANENT_KEY);
      }

      setUserToken(null);
      setSecureToken(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 🧹 Clear only session
  const clearSessionToken = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_SESSION_KEY, STORAGE_USER_DATA]);
      setUserToken(null);
      setUserData(null);
    } catch (error) {
      console.error('ClearSessionToken error:', error);
    }
  };

  // ✅ On app load: check session + secure token - ONLY ONCE
  useEffect(() => {
    if (hasCheckedTokens) {
      console.log('🚫 StableAuthContext: Already checked tokens, skipping...');
      return;
    }

    const checkStoredTokens = async () => {
      try {
        console.log('🔍 StableAuthContext: Starting ONE-TIME token check...');
        setIsLoading(true);
        
        const userDataRaw = await AsyncStorage.getItem(STORAGE_USER_DATA);
        const userDataParsed = userDataRaw ? JSON.parse(userDataRaw) : null;

        const permanentToken = isWeb
          ? await AsyncStorage.getItem(STORAGE_PERMANENT_KEY)
          : await SecureStore.getItemAsync(STORAGE_PERMANENT_KEY);

        console.log('🔍 StableAuthContext: Token check results:', {
          hasUserData: !!userDataParsed,
          hasPermanentToken: !!permanentToken,
          platform: Platform.OS
        });

        setUserData(userDataParsed || null);
        setSecureToken(permanentToken || null);
        
        console.log('✅ StableAuthContext: Token check completed successfully');
        
      } catch (error) {
        console.error('❌ StableAuthContext: checkStoredTokens error:', error);
        setUserToken(null);
        setUserData(null);
        setSecureToken(null);
      } finally {
        setIsLoading(false);
        setHasCheckedTokens(true);
        console.log('✅ StableAuthContext: Loading state set to false, check completed');
      }
    };

    checkStoredTokens();
  }, []); // ONLY run once on mount

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        clearSessionToken,
        userToken,
        userData,
        secureToken,
        updateUserData,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};