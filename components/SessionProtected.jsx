import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSessionToken } from '../services/auth/sessionManager';
import { ThemedText } from './ThemedText';

/**
 * Higher-order component that protects any component with session validation
 * Automatically redirects to PIN validation if session is invalid
 */
export const SessionProtected = ({ children, checkOnMount = true }) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(checkOnMount);
  const [hasValidSession, setHasValidSession] = useState(!checkOnMount);

  useEffect(() => {
    const checkSession = async () => {
      if (!checkOnMount) return;

      try {
        setIsChecking(true);
        const sessionToken = await getSessionToken();
        
        if (!sessionToken) {
          console.log('SessionProtected: No valid session token, redirecting to PIN validation');
          router.replace('/auth/PinValidateScreen');
          return;
        }
        
        setHasValidSession(true);
      } catch (error) {
        console.error('SessionProtected: Error checking session:', error);
        router.replace('/auth/PinValidateScreen');
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [checkOnMount, router]);

  // Show loading while checking session
  if (isChecking) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#000000" />
        <ThemedText style={{ marginTop: 16, color: '#666666' }}>
          Verifying session...
        </ThemedText>
      </View>
    );
  }

  // Render children only if session is valid
  return hasValidSession ? children : null;
};

/**
 * HOC function to wrap any component with session protection
 */
export const withSessionProtection = (Component, options = {}) => {
  return function SessionProtectedComponent(props) {
    return (
      <SessionProtected checkOnMount={options.checkOnMount !== false}>
        <Component {...props} />
      </SessionProtected>
    );
  };
};