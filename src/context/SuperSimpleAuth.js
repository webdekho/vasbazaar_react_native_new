import React, { createContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log('✅ SuperSimpleAuth: Rendering without any async operations');

  // Absolutely minimal - no useEffect, no async, no state changes
  const value = {
    userToken: null,
    userData: null, 
    secureToken: null,
    isLoading: false, // Always false - no loading
    login: () => {},
    logout: () => {},
    clearSessionToken: () => {},
    updateUserData: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};