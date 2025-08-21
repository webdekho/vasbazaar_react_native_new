import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import AppStack from './AppStack';
import AuthStack from './AuthStack';
import SessionStack from './SessionStack';

const Navigation = ({ initialReferralCode }) => {
  const { userToken, secureToken, isLoading } = useContext(AuthContext);

  console.log('🧭 Navigation state:', { 
    userToken: !!userToken, 
    secureToken: !!secureToken, 
    isLoading,
    timestamp: new Date().toISOString()
  });

  // Show loading screen while checking auth state
  if (isLoading) {
    console.log('🔄 Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8400E5" />
        <Text style={styles.loadingText}>Loading VasBazaar...</Text>
      </View>
    );
  }

  // User has permanent token but no session token - show PIN validation
  if (secureToken && !userToken) {
    console.log('🔑 Navigating to SessionStack (PIN required)');
    return <SessionStack />;
  }

  // User is fully authenticated - show main app
  if (secureToken && userToken) {
    console.log('✅ Navigating to AppStack (authenticated)');
    return <AppStack />;
  }

  // No tokens - show authentication flow
  console.log('🔐 Navigating to AuthStack (not authenticated)', { initialReferralCode });
  return <AuthStack initialReferralCode={initialReferralCode} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8400E5',
    fontWeight: '500',
  },
});

export default Navigation;
