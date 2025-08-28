// Example usage of session manager in your app

import { getSessionToken, isSessionValid, getRemainingSessionTime, extendSession, logout } from './sessionManager';

// Example: Using in API calls
export const makeAuthenticatedRequest = async () => {
  const token = await getSessionToken();
  
  if (!token) {
    // Session expired, redirect to login
    console.log('Session expired, please login again');
    return { error: 'Session expired' };
  }
  
  // Use token for API call
  return await someApiCall(token);
};

// Example: Check session in app startup
export const checkUserSession = async () => {
  const isValid = await isSessionValid();
  
  if (isValid) {
    console.log('User is logged in');
    return true;
  } else {
    console.log('User needs to login');
    return false;
  }
};

// Example: Show remaining session time
export const showSessionStatus = async () => {
  const remainingMinutes = await getRemainingSessionTime();
  console.log(`Session expires in ${remainingMinutes} minutes`);
};

// Example: Extend session on user activity
export const handleUserActivity = async () => {
  const extended = await extendSession();
  if (extended) {
    console.log('Session extended by 10 more minutes');
  }
};

// Example: Manual logout
export const handleLogout = async () => {
  await logout();
  console.log('User logged out and data cleared');
};