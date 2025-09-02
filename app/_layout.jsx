import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import AuthGuard from '../components/AuthGuard';
import { GlobalSessionInterceptor } from '../components/GlobalSessionInterceptor';
import { AuthProvider } from '../context/AuthContext';
import { StableLayoutProvider } from '../components/StableLayoutProvider';


export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
                {/* StatusBar configuration for stable layout */}
                <StatusBar 
                  style="dark" 
                  backgroundColor="#ffffff"
                  translucent={false}
                  hideTransitionAnimation="fade"
                />
                
                {/* Root container with viewport stabilization */}
                <View style={styles.rootContainer}>
                  <KeyboardAvoidingView 
                    style={styles.keyboardContainer} 
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
    // Prevent viewport shifts
    ...(Platform.OS === 'android' && {
      overflow: 'hidden',
    }),
    // Lock dimensions on web with tab bar space
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      maxHeight: '100vh',
      paddingBottom: 60, // Add space for tab bar
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
  },
});
