import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionToken } from '../services/auth/sessionManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permanentToken, setPermanentToken] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const sessionToken = await getSessionToken();
      const user = await AsyncStorage.getItem('userData');
      const permToken = await AsyncStorage.getItem('permanentToken');
      
      console.log('AuthContext - checkAuthState result:', {
        hasSessionToken: !!sessionToken,
        hasUserData: !!user,
        hasPermanentToken: !!permToken
      });
      
      setUserToken(sessionToken);
      setUserData(user ? JSON.parse(user) : null);
      setPermanentToken(permToken);
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Computed auth state properties
  const isAuthenticated = !!userToken;
  const needsPinValidation = !!permanentToken && !userToken;
  const shouldRedirectToLogin = !permanentToken;
  
  // Debug logging for state changes
  React.useEffect(() => {
    console.log('AuthContext - Computed auth state:', {
      isAuthenticated,
      needsPinValidation, 
      shouldRedirectToLogin,
      hasUserToken: !!userToken,
      hasPermanentToken: !!permanentToken
    });
  }, [isAuthenticated, needsPinValidation, shouldRedirectToLogin, userToken, permanentToken]);

  const authContextValue = {
    userToken,
    userData,
    isLoading,
    permanentToken,
    isAuthenticated,
    needsPinValidation,
    shouldRedirectToLogin,
    setUserToken,
    setUserData,
    checkAuthState,
    refreshAuth: checkAuthState, // Alias for backwards compatibility
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };