import React, { createContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log('✅ MinimalAuthContext: Rendering...');

  // Minimal static values - no async operations, no effects, nothing that can fail
  const authValue = {
    userToken: null,
    userData: null, 
    secureToken: null,
    isLoading: false,
    login: () => console.log('login called'),
    logout: () => console.log('logout called'),
    clearSessionToken: () => console.log('clearSessionToken called'),
    updateUserData: () => console.log('updateUserData called'),
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};