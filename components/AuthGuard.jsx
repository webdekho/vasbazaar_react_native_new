import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth, getAuthRedirect } from '../app/hooks/useAuth';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_EVENTS } from '../services/auth/authEvents';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const authState = useAuth();
  const [lastRedirect, setLastRedirect] = React.useState('');
  
  // Listen for logout events to clear state
  useEffect(() => {
    const unsubscribe = authEvents.on(AUTH_EVENTS.LOGOUT, () => {
      console.log('AuthGuard: Logout event received, clearing redirect state');
      // Clear last redirect to ensure fresh navigation decisions
      setLastRedirect('');
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const checkBypassFlag = async () => {
      if (authState.isLoading) {
        return; // Don't redirect while loading
      }

      // Check if PIN or OTP validation just succeeded
      const pinBypassFlag = await AsyncStorage.getItem('pinValidationSuccess');
      const otpBypassFlag = await AsyncStorage.getItem('otpValidationSuccess');
      const pinSetBypassFlag = await AsyncStorage.getItem('pinSetSuccess');
      if (pinBypassFlag === 'true' || otpBypassFlag === 'true' || pinSetBypassFlag === 'true') {
        console.log('AuthGuard - Bypass active, skipping navigation');
        return; // Don't interfere with navigation
      }

      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const inMainGroup = segments[0] === 'main';
      const currentPath = `/${segments.join('/')}`;

      // Determine where user should be based on auth state
      const redirectPath = getAuthRedirect(authState);

      // Handle redirects based on auth state
      let targetPath = null;
      
      console.log('AuthGuard - Navigation decision:', {
        currentPath,
        authState: {
          isAuthenticated: authState.isAuthenticated,
          needsPinValidation: authState.needsPinValidation,
          shouldRedirectToLogin: authState.shouldRedirectToLogin,
          isLoading: authState.isLoading,
          userToken: !!authState.userToken,
          permanentToken: !!authState.permanentToken,
          userTokenLength: authState.userToken?.length || 0,
          permanentTokenLength: authState.permanentToken?.length || 0
        },
        inAuthGroup,
        inTabsGroup,
        inMainGroup,
        lastRedirect,
        bypassFlags: {
          pinBypassFlag,
          otpBypassFlag,
          pinSetBypassFlag
        }
      });
      
      if (authState.shouldRedirectToLogin && !inAuthGroup) {
        // Not authenticated, redirect to login
        console.log('AuthGuard - Redirecting to login (shouldRedirectToLogin)');
        targetPath = '/auth/LoginScreen';
      } else if (authState.needsPinValidation && currentPath !== '/auth/PinValidateScreen') {
        // Need PIN validation, redirect to PIN screen
        console.log('AuthGuard - Redirecting to PIN validation');
        targetPath = '/auth/PinValidateScreen';
      } else if (authState.isAuthenticated && authState.userToken && inAuthGroup) {
        // ONLY redirect to home if we have BOTH isAuthenticated AND userToken
        console.log('AuthGuard - Redirecting authenticated user from auth to home');
        targetPath = '/(tabs)/home';
      } else if (authState.isAuthenticated && authState.userToken && !inTabsGroup && !inAuthGroup && !inMainGroup) {
        // ONLY redirect to home if we have BOTH isAuthenticated AND userToken
        console.log('AuthGuard - Redirecting authenticated user to home (not in main groups)');
        targetPath = '/(tabs)/home';
      } else if (!authState.isAuthenticated && (inTabsGroup || inMainGroup)) {
        // User is not authenticated but in protected areas - redirect to login
        console.log('AuthGuard - Unauthenticated user in protected area, redirecting to login');
        targetPath = '/auth/LoginScreen';
      }
      
      // Only redirect if target path is different from last redirect to prevent loops
      if (targetPath && targetPath !== lastRedirect && currentPath !== targetPath) {
        console.log('AuthGuard - Executing redirect to:', targetPath);
        setLastRedirect(targetPath);
        router.replace(targetPath);
      } else if (targetPath) {
        console.log('AuthGuard - Skipping redirect (same as last or current):', {
          targetPath,
          lastRedirect,
          currentPath
        });
      }
    };

    checkBypassFlag();
  }, [
    authState.isAuthenticated, 
    authState.needsPinValidation, 
    authState.shouldRedirectToLogin,
    authState.isLoading,
    segments
  ]);

  // Show loading screen while checking authentication
  if (authState.isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Render children if auth state is resolved
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});