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
import { useVersionCheck } from '../hooks/useVersionCheck';
import VersionUpdatePopup from '../components/VersionUpdatePopup';


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isLandscape } = useOrientation();

  // Global version check hook
  const {
    showPrompt: showVersionPrompt,
    promptData: versionData,
    handleUpdate,
    dismissPrompt,
    checkVersion
  } = useVersionCheck();

  // Set up global version check every 5 minutes
  useEffect(() => {
    // Initial version check after a short delay
    const initialTimer = setTimeout(() => {
      console.log('🔄 Initial version check...');
      checkVersion();
    }, 3000); // Wait 3 seconds after app load

    // Set up interval for version check every 5 minutes (300,000 milliseconds)
    const versionCheckInterval = setInterval(() => {
      console.log('🔄 Periodic version check (5 min interval)...');
      checkVersion();
    }, 5 * 60 * 1000);

    // Cleanup timers on component unmount
    return () => {
      if (initialTimer) {
        clearTimeout(initialTimer);
      }
      if (versionCheckInterval) {
        clearInterval(versionCheckInterval);
        console.log('🛑 Global version check interval cleared');
      }
    };
  }, [checkVersion]);

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
        <Stack.Screen name="main/common/SuccessScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/FailedScreen" options={{ headerShown: false }} />
        <Stack.Screen name="main/common/PendingScreen" options={{ headerShown: false }} />
        
        <Stack.Screen name="+not-found" />
                  </Stack>
                  </KeyboardAvoidingView>
                </View>
                </GlobalSessionInterceptor>
                
                {/* Version Update Popup */}
                <VersionUpdatePopup
                  visible={showVersionPrompt}
                  onUpdate={handleUpdate}
                  onDismiss={dismissPrompt}
                  currentVersion={versionData?.current}
                  latestVersion={versionData?.latest}
                  forceUpdate={versionData?.forceUpdate}
                />
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
