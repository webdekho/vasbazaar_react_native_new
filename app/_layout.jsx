import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import 'react-native-reanimated';
import AuthGuard from '../components/AuthGuard';
import { GlobalSessionInterceptor } from '../components/GlobalSessionInterceptor';
import { AuthProvider } from '../context/AuthContext';
import { StableLayoutProvider } from '../components/StableLayoutProvider';
import { useOrientation } from '../hooks/useOrientation';
import VersionUpdatePopup from '../components/VersionUpdatePopup';
import PWAPromptInstaller from '../components/PWAPromptInstaller';
// Import PWA test helpers in development
if (process.env.NODE_ENV === 'development') {
  require('../utils/pwaTestHelpers');
}


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isLandscape } = useOrientation();

  // Note: VersionUpdatePopup handles its own 5-minute intervals internally

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StableLayoutProvider>
        <AuthProvider>
          <ThemeProvider value={DefaultTheme}>
            <AuthGuard>
                <GlobalSessionInterceptor>
                {/* StatusBar configuration for cross-platform compatibility */}
                <StatusBar 
                  style="light" 
                  backgroundColor={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                  translucent={Platform.OS === 'android'}
                  hideTransitionAnimation="fade"
                />
                
                {/* Root container with viewport stabilization */}
                <View style={[styles.rootContainer, isLandscape && styles.rootContainerLandscape]}>
                  <KeyboardAvoidingView 
                    style={[styles.keyboardContainer, isLandscape && styles.keyboardContainerLandscape]} 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                    enabled={Platform.OS === 'ios'}
                  >
                  <Stack>
        {/* Root redirect */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Auth Screens */}
        <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/OtpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/AadhaarScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/AadhaarOtpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/PinSetScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/PinValidateScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/PinOtpScreen" options={{ headerShown: false }} />
        
        {/* Main App Screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="main/NotificationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/AllServicesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/HelpScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/ComplaintScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/QrPrintScreen" options={{ headerShown: false }} />
        
        {/* Prepaid Screens */}
        <Stack.Screen name="main/prepaid/ContactListScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/prepaid/RechargePlanScreen" options={{ headerShown: false }} />
        
        {/* DTH Screens */}
        <Stack.Screen name="main/dth/DthListScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/dth/DthRechargeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/dth/DthPlanScreen" options={{ headerShown: false }} />
        
        {/* Biller Screens */}
        <Stack.Screen name="main/biller/BillerListScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/biller/BillerRechargeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/biller/BillViewScreen" options={{ headerShown: false }} />
        
        {/* Common Screens */}
        <Stack.Screen name="main/common/OfferScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/PaymentScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/PaymentScreenPayu" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/SuccessScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/FailedScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/PendingScreen" options={{ headerShown: false }} />
        
        <Stack.Screen name="+not-found" />
                  </Stack>
                  </KeyboardAvoidingView>
                </View>
                </GlobalSessionInterceptor>
                
                {/* Version Update Popup - runs its own 5-minute version checks */}
                <VersionUpdatePopup />
                
                {/* PWA Install Prompt - shows after login on tab routes */}
                <PWAPromptInstaller />
              </AuthGuard>
          </ThemeProvider>
        </AuthProvider>
      </StableLayoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    // Stable layout positioning
    position: 'relative',
    backgroundColor: '#ffffff',
    // Prevent viewport shifts
    ...(Platform.OS === 'android' && {
      overflow: 'hidden',
    }),
    // Improved web dimensions handling
    ...(Platform.OS === 'web' && {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      // Remove padding - let content handle its own spacing
      paddingBottom: 0,
      // Ensure full viewport coverage
      width: '100vw',
      // Prevent scrollbars
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
  },
  rootContainerLandscape: {
    // Landscape specific adjustments
    ...(Platform.OS === 'web' && {
      height: '100vh',
      width: '100vw',
    }),
  },
  keyboardContainer: {
    flex: 1,
    position: 'relative',
    // Ensure consistent behavior across platforms
    ...(Platform.OS === 'android' && {
      // Android-specific optimizations
      flexShrink: 0,
      flexGrow: 1,
    }),
    ...(Platform.OS === 'web' && {
      height: '100%',
      overflow: 'hidden',
    }),
  },
  keyboardContainerLandscape: {
    // Landscape specific adjustments
    flex: 1,
  },
});
