import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getSessionToken } from '../services/auth/sessionManager';
import { startSessionTimeout, stopSessionTimeout, isSessionTimeoutActive } from '../services/auth/sessionTimeoutService';

/**
 * Global session interceptor that monitors navigation and user interactions
 * Automatically redirects to PIN validation if session expires
 */
export const GlobalSessionInterceptor = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeSessionManagement = async () => {
      try {
        // Skip if user is in auth screens
        const isInAuthScreens = segments[0] === 'auth';
        if (isInAuthScreens) {
          // Stop session timeout if in auth screens
          stopSessionTimeout();
          return;
        }

        // Check if user has a valid session
        const sessionToken = await getSessionToken();
        
        if (!sessionToken) {
          console.log('GlobalSessionInterceptor: No valid session, redirecting to PIN validation');
          stopSessionTimeout();
          router.replace('/auth/PinValidateScreen');
          return;
        }

        // Check if session timeout is already active
        const timeoutActive = await isSessionTimeoutActive();
        
        if (!timeoutActive) {
          // Start session timeout monitoring with redirect callback
          startSessionTimeout(() => {
            console.log('Session expired callback - redirecting to PIN validation');
            router.replace('/auth/PinValidateScreen');
          });
        }

      } catch (error) {
        console.error('GlobalSessionInterceptor: Error initializing session management:', error);
        // Don't redirect on error to avoid loops
      }
    };

    // Initialize session management
    initializeSessionManagement();

    // Cleanup function
    return () => {
      // Don't stop timeout here as it should persist across component re-renders
      // stopSessionTimeout();
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