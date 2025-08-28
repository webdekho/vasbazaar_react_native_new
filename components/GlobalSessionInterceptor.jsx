import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getSessionToken } from '../services/auth/sessionManager';

/**
 * Global session interceptor that monitors navigation and user interactions
 * Automatically redirects to PIN validation if session expires
 */
export const GlobalSessionInterceptor = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let intervalId;

    const checkSessionPeriodically = async () => {
      try {
        // Skip check if user is already in auth screens
        const isInAuthScreens = segments[0] === 'auth';
        if (isInAuthScreens) return;

        const sessionToken = await getSessionToken();
        
        if (!sessionToken) {
          console.log('GlobalSessionInterceptor: Session expired, redirecting to PIN validation');
          router.replace('/auth/PinValidateScreen');
        }
      } catch (error) {
        console.error('GlobalSessionInterceptor: Error checking session:', error);
        // Don't redirect on error to avoid loops
      }
    };

    // Check session every 30 seconds
    intervalId = setInterval(checkSessionPeriodically, 30000);

    // Initial check
    checkSessionPeriodically();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [router, segments]);

  return children;
};

/**
 * Function to manually trigger session check from anywhere in the app
 */
export const triggerGlobalSessionCheck = async () => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      console.log('Manual session check: No valid session token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Manual session check error:', error);
    return false;
  }
};