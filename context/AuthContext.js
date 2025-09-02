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
      
      setUserToken(sessionToken);
      setUserData(user ? JSON.parse(user) : null);
      setPermanentToken(permToken);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is verified
  const isVerified = userData?.verified_status !== null && userData?.verified_status !== undefined;
  
  // Computed auth state properties
  const isAuthenticated = !!userToken && isVerified; // Only authenticated if verified
  const needsPinValidation = !!permanentToken && !userToken;
  const shouldRedirectToLogin = !permanentToken || !isVerified; // Redirect if not verified
  
  // Debug logging for state changes
  React.useEffect(() => {
 
  }, [isAuthenticated, needsPinValidation, shouldRedirectToLogin, userToken, permanentToken, isVerified, userData]);

  const authContextValue = {
    userToken,
    userData,
    isLoading,
    permanentToken,
    isAuthenticated,
    needsPinValidation,
    shouldRedirectToLogin,
    isVerified,
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