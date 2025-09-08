import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authenticateWithPin, sendPinOtp } from '../../services';
import { saveSessionToken } from '../../services/auth/sessionManager';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  isBiometricAuthAvailable, 
  biometricLogin, 
  setupBiometricAuth,
  checkBiometricSupport,
  debugIOSBiometrics,
  resetBiometricSession,
  isBiometricInProgress
} from '../../services/auth/biometricService';
import { 
  storeSecurePin, 
  getUserIdentifier, 
  getBiometricPreference,
  isBiometricSetupCompleted,
  getSecurePin
} from '../../utils/secureStorage';
import { triggerPWAPromptAfterLogin } from '../../components/PWAPromptInstaller';

export default function PinValidateScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [permanentToken, setPermanentToken] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAuthType, setBiometricAuthType] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [biometricAttempted, setBiometricAttempted] = useState(false);
  
  // Use refs to prevent race conditions and double calls
  const biometricInProgress = useRef(false);
  const componentMounted = useRef(true);
  const autoAttemptCompleted = useRef(false);
  const biometricSessionId = useRef(Date.now().toString()); // Unique session ID

  // Initialize authentication flow
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing PinValidate screen...');
        
        // Check for permanent token first
        const token = await AsyncStorage.getItem('permanentToken');
        if (!token) {
          console.log('❌ No permanent token found - redirecting to login');
          setInitializing(false);
          router.replace('/auth/LoginScreen');
          return;
        }
        
        // Set token and check biometric in parallel to reduce loading time
        setPermanentToken(token);
        
        // Small delay to prevent immediate state changes from causing flicker
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check biometric availability
        const availability = await isBiometricAuthAvailable();
        console.log('📱 Biometric availability:', availability);
        
        // iOS-specific debugging
        if (Platform.OS === 'ios') {
          const iosDebug = await debugIOSBiometrics();
          console.log('🍎 iOS Biometric Debug Results:', JSON.stringify(iosDebug, null, 2));
          
          // Additional iOS checks
          console.log('🍎 iOS Additional Debug Info:', {
            isDevelopment: __DEV__,
            deviceType: 'iOS Device',
            hasHardware: iosDebug.hasHardware,
            isEnrolled: iosDebug.isEnrolled,
            supportedTypes: iosDebug.supportedTypes,
            authTypeNames: iosDebug.authTypeNames,
            testAuthResult: iosDebug.testAuth
          });
        }
        
        // Batch state updates to prevent flickering
        if (availability.available) {
          // Biometric is available and configured - set state and attempt login
          setBiometricAvailable(true);
          setBiometricAuthType(availability.deviceSupport?.authTypes?.[0] || 'Biometric');
          setInitializing(false);
          
          console.log('✨ Biometric is available - will attempt automatic authentication...');
          console.log('🔍 availability.available value:', availability.available);
          
          // Small delay to ensure UI is stable before showing biometric prompt
          // ULTRA-MULTIPLE protections against double prompts
          if (!biometricAttempted && 
              !autoAttemptCompleted.current && 
              !biometricInProgress.current && 
              !isBiometricInProgress()) {
            console.log('🎯 Scheduling automatic biometric attempt...');
            autoAttemptCompleted.current = true; // Mark as scheduled
            
            // Set a timeout with abort mechanism
            const timeoutId = setTimeout(async () => {
              // Final check before execution
              if (componentMounted.current && 
                  !biometricInProgress.current && 
                  !isBiometricInProgress()) {
                
                console.log('🚀 Executing scheduled biometric attempt...');
                setBiometricAttempted(true);
                
                // Add timeout protection to prevent infinite hangs
                const biometricTimeout = setTimeout(() => {
                  console.warn('⏰ Biometric timeout - resetting session');
                  biometricInProgress.current = false;
                  setBiometricLoading(false);
                  resetBiometricSession().catch(console.warn);
                }, 10000); // 10 second timeout
                
                try {
                  await attemptBiometricLogin();
                } finally {
                  clearTimeout(biometricTimeout);
                }
              } else {
                console.log('⚠️ Final check failed - skipping scheduled biometric');
              }
            }, 500); // Increased delay to 500ms
            
            // Store timeout ID for cleanup
            setTimeout(() => clearTimeout(timeoutId), 12000); // Auto-cleanup after 12 seconds
            
          } else {
            console.log('⚠️ Skipping automatic biometric - multiple conditions failed', {
              biometricAttempted,
              autoAttemptCompleted: autoAttemptCompleted.current,
              localInProgress: biometricInProgress.current,
              globalInProgress: isBiometricInProgress()
            });
          }
          
        } else if (availability.canSetup) {
          // Device supports biometric but not set up yet
          setBiometricAuthType(availability.deviceSupport?.authTypes?.[0] || 'Biometric');
          setInitializing(false);
          console.log('🔧 Device ready for biometric setup - will setup after PIN validation');
        } else {
          console.log('❌ Biometric not available:', availability.reason);
          setInitializing(false);
        }
        
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        setError('Failed to initialize authentication. Please try again.');
        setInitializing(false);
      }
    };

    // Small initial delay to prevent flash of content and ensure component is mounted
    const timeoutId = setTimeout(initializeAuth, 100);
    
    // Cleanup function
    return () => {
      componentMounted.current = false;
      clearTimeout(timeoutId);
      // Emergency cleanup of any lingering biometric session
      resetBiometricSession().catch(console.warn);
    };
  }, []);


  // Attempt automatic biometric login
  const attemptBiometricLogin = async () => {
    // ULTRA-CRITICAL protection: prevent concurrent biometric attempts
    if (biometricInProgress.current) {
      console.log('🚫 LOCAL: Biometric authentication already in progress - aborting');
      return;
    }
    
    // Check global service state
    if (isBiometricInProgress()) {
      console.log('🚫 GLOBAL: Biometric authentication already in progress - aborting');
      return;
    }

    if (!componentMounted.current) {
      console.log('🚫 Component unmounted - aborting biometric attempt');
      return;
    }

    // Check AsyncStorage for any active session
    try {
      const sessionCheck = await AsyncStorage.getItem('biometric_session_active');
      if (sessionCheck) {
        const sessionTime = parseInt(sessionCheck, 10);
        if (Date.now() - sessionTime < 3000) { // 3 second check
          console.log('🚫 STORAGE: Active biometric session detected - aborting');
          return;
        }
      }
    } catch (error) {
      console.warn('Could not check biometric session storage:', error);
    }

    try {
      console.log(`🔐 Starting biometric attempt [Session: ${biometricSessionId.current}]`);
      biometricInProgress.current = true; // Set flag immediately
      setBiometricLoading(true);
      
      console.log('🔐 Attempting biometric authentication with API...');
      
      // First, let's verify what we have stored
      const userId = await getUserIdentifier();
      console.log('🆔 Current user ID:', userId);
      
      if (userId) {
        const biometricEnabled = await getBiometricPreference(userId);
        const biometricSetup = await isBiometricSetupCompleted(userId);
        const hasStoredPin = await getSecurePin(userId);
        
        console.log('📊 Current biometric status before login attempt:', {
          userId,
          biometricEnabled,
          biometricSetup,
          hasStoredPin: !!hasStoredPin
        });
      }
      
      const result = await biometricLogin();
      
      console.log('📱 Biometric login result:', result);
      console.log('📱 Full biometric login result details:', JSON.stringify(result, null, 2));
      
      if (result.success && result.loginData) {
        // Biometric API login was successful
        console.log('✅ Biometric authentication successful - navigating to home');
        
        // Set bypass flag and navigate
        await AsyncStorage.setItem('pinValidationSuccess', 'true');
        
        setTimeout(async () => {
          await refreshAuth();
          setTimeout(() => {
            AsyncStorage.removeItem('pinValidationSuccess');
          }, 1000);
          // Trigger PWA prompt after successful login
          console.log('🔐 [PinValidateScreen] About to call triggerPWAPromptAfterLogin');
          await triggerPWAPromptAfterLogin();
          console.log('🔐 [PinValidateScreen] triggerPWAPromptAfterLogin completed');
          router.replace('/(tabs)/home');
        }, 200);
        
      } else if (result.userCancel || result.systemCancel || result.iosCancellation) {
        console.log('ℹ️ Biometric authentication cancelled by user');
        // User cancelled - show PIN interface without error
        // Reset biometricAttempted for manual retry, but not for automatic retry
      } else {
        console.log('❌ Biometric authentication failed:', result.reason || result.error);
        
        // Add more specific debugging for common issues
        if (result.error === 'Biometric authentication not enabled') {
          console.log('🔧 Biometric not enabled - user needs to enter PIN first to set up biometric');
        } else if (result.error === 'User identifier not found') {
          console.log('🔧 User identifier not found - this suggests app state issue');
        }
        
        // Only show error messages that are not user cancellations to reduce UI flicker
        if (!result.userCancel && !result.systemCancel) {
          let errorMsg = 'Please use your PIN to continue.';
          
          if (result.isExpoGoLimitation) {
            errorMsg = 'Biometric authentication may not work fully in Expo Go. Please use your PIN.';
          } else if (result.isIOSLimitation) {
            errorMsg = 'Face ID/Touch ID is not available or set up. Please use your PIN.';
          } else if (result.isIOSPermissionIssue) {
            errorMsg = 'Face ID/Touch ID permission is required. Please enable it in Settings or use your PIN.';
          } else if (Platform.OS === 'ios' && result.error?.includes('not available')) {
            errorMsg = 'Face ID/Touch ID is not available on this device. Please use your PIN.';
          }
          
          if (errorMsg) setError(errorMsg);
        }
      }
    } catch (error) {
      console.error('💥 Error during biometric authentication:', error);
      setError('An error occurred during biometric authentication. Please use your PIN.');
    } finally {
      biometricInProgress.current = false; // Always reset flag
      setBiometricLoading(false);
    }
  };

  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Auto-validate when 4 digits entered
      if (newPin.length === 4) {
        handlePinValidation(newPin);
      }
    }
    setError('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handlePinValidation = async (pinToValidate = pin) => {
    if (pinToValidate.length !== 4 || !permanentToken) return;

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Validating PIN with API...');
      const response = await authenticateWithPin(pinToValidate, permanentToken);
      console.log('🔐 PIN validation API response:', response);
      
      if (response?.status === 'success') {
        console.log('✅ PIN validation successful - processing response...');
        const data = response.data;
        const sessionToken = data.token;

        // Prepare user data
        const userData = {
          refferalCode: data.referralCode || data.refferalCode,
          verified_status: data.verified_status,
          name: data.name,
          mobile: data.mobile,
          city: data.city,
          state: data.state,
          userType: data.userType,
          pin: data.pin
        };

        // Save profile photo if provided
        if (data.profile) {
          await AsyncStorage.setItem("profile_photo", data.profile);
        }

        // Save session token and user data
        await saveSessionToken(sessionToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ Session token and user data saved');
        
        // Don't setup biometric here - let Home screen handle it
        // Just save the PIN for later biometric setup
        console.log('💾 Saving PIN for future biometric setup...');
        await AsyncStorage.setItem('tempPinForBiometric', pinToValidate);
        
        // Verify the PIN was saved
        const savedPin = await AsyncStorage.getItem('tempPinForBiometric');
        console.log('💾 Verified temp PIN saved:', savedPin);
        
        // Set bypass flag and navigate
        await AsyncStorage.setItem('pinValidationSuccess', 'true');
        
        console.log('✅ All processing complete - navigating to home');
        
        setTimeout(async () => {
          await refreshAuth();
          setTimeout(() => {
            AsyncStorage.removeItem('pinValidationSuccess');
          }, 1000);
          // Trigger PWA prompt after successful login
          console.log('🔐 [PinValidateScreen] About to call triggerPWAPromptAfterLogin');
          await triggerPWAPromptAfterLogin();
          console.log('🔐 [PinValidateScreen] triggerPWAPromptAfterLogin completed');
          router.replace('/(tabs)/home');
        }, 200);
        
      } else {
        console.log('❌ PIN validation failed:', response?.message);
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('❌ PIN validation error:', error);
      setError('Network error. Please check your connection and try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };


  // Manual biometric login trigger
  const handleBiometricLogin = async () => {
    if (biometricLoading || biometricInProgress.current) {
      console.log('🚫 Manual biometric blocked - already in progress');
      return;
    }
    
    console.log('🔐 Manual biometric authentication triggered');
    setBiometricAttempted(true); // Mark as attempted
    setError('');
    
    // Check if biometric is actually set up
    const availability = await isBiometricAuthAvailable();
    
    if (availability.available) {
      // Biometric is set up - proceed with login
      await attemptBiometricLogin();
    } else if (availability.canSetup) {
      // Biometric not set up yet - need to set up first
      console.log('🔧 Biometric not set up yet - need PIN first');
      setBiometricLoading(false);
      setError('Please enter your PIN first to enable biometric authentication.');
    } else {
      // Device doesn't support biometric
      console.log('❌ Biometric not supported:', availability.reason);
      setBiometricLoading(false);
      
      const errorMessage = Platform.OS === 'ios' 
        ? 'Face ID/Touch ID is not available or set up on this device.'
        : 'Biometric authentication is not available on this device.';
      
      setError(errorMessage);
    }
  };


  const handleForgotPin = () => {
    console.log('🔧 handleForgotPin clicked - starting pin change process');
    // Directly start the change pin process
    handleChangePinRequest();
  };

  const handleChangePinRequest = async () => {
    console.log('🔧 handleChangePinRequest called');
    console.log('🔧 permanentToken exists:', !!permanentToken);
    console.log('🔧 sendPinOtp function exists:', typeof sendPinOtp);
    
    if (!permanentToken) {
      console.log('❌ No permanent token available');
      setError('Session expired. Please login again.');
      router.push('/auth/LoginScreen');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📱 Sending PIN change OTP with token:', permanentToken.substring(0, 20) + '...');
      console.log('📱 About to call sendPinOtp...');
      
      const response = await sendPinOtp(permanentToken);
      
      console.log('📱 PIN OTP response received:', response);
      console.log('📱 Response status:', response?.status);
      console.log('📱 Response data:', response?.data);
      
      if (response?.status === 'success') {
        console.log('✅ PIN OTP sent successfully - navigating to PinOtpScreen');
        
        // Navigate to PinOtpScreen with change pin context
        router.push({
          pathname: '/auth/PinOtpScreen',
          params: {
            changePin: 'true',
            temptoken: response.data || response.data?.token,
            permanentToken: permanentToken,
          }
        });
      } else {
        console.log('❌ PIN OTP failed:', response?.message);
        setError(response?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ PIN OTP error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      // Clear all authentication data
      const keysToRemove = [
        'permanentToken', 'userData', 'aadhaarData', 'profile_photo',
        'sessionToken', 'sessionTokenExpiry', 'pinValidationSuccess',
        'otpValidationSuccess', 'pinSetSuccess', 'aadhaarVerificationSuccess'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Account switched - cleared all data');
      
      router.replace('/auth/LoginScreen');
    } catch (error) {
      console.error('❌ Error switching account:', error);
      router.replace('/auth/LoginScreen');
    }
  };

  const renderPinDisplay = () => {
    return (
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'back']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.numberButton,
                  item === '' && styles.numberButtonEmpty
                ]}
                onPress={() => {
                  if (item === 'back') {
                    handleBackspace();
                  } else if (item !== '') {
                    handleNumberPress(item);
                  }
                }}
                disabled={item === '' || loading}
              >
                {item === 'back' ? (
                  <ThemedText style={[
                    styles.backButtonText,
                  ]}>⌫</ThemedText>
                ) : (
                  <ThemedText style={[
                    styles.numberButtonText,
                  ]}>{item}</ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (initializing) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <FontAwesome name="lock" size={32} color="#666" />
          <ThemedText style={styles.loadingText}>Initializing...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {biometricLoading ? 'Authenticating...' : 'Enter Your PIN'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {biometricAvailable 
              ? `Use ${biometricAuthType.toLowerCase()} or enter your 4-digit PIN`
              : 'Enter your 4-digit PIN to access your account'
            }
          </ThemedText>
        </ThemedView>

        {/* Biometric Authentication Section */}
        {biometricAvailable && (
          <ThemedView style={styles.biometricSection}>
            <TouchableOpacity 
              style={[styles.biometricButton, biometricLoading && styles.biometricButtonLoading]}
              onPress={handleBiometricLogin}
              disabled={biometricLoading || loading}
            >
              {biometricLoading ? (
                <FontAwesome name="spinner" size={24} color="#ffffff" />
              ) : (
                <>
                  {biometricAuthType === 'Face ID' ? (
                    <MaterialIcons name="face" size={24} color="#ffffff" />
                  ) : (
                    <MaterialIcons name="fingerprint" size={24} color="#ffffff" />
                  )}
                </>
              )}
              <ThemedText style={styles.biometricButtonText}>
                {biometricLoading 
                  ? 'Authenticating...' 
                  : `Use ${biometricAuthType || 'Biometric'}`
                }
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {biometricAvailable && (
          <ThemedView style={styles.dividerSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View style={styles.dividerLine} />
            </View>
          </ThemedView>
        )}

        {renderPinDisplay()}

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        {loading && (
          <ThemedText style={styles.loadingText}>Validating...</ThemedText>
        )}

        {renderNumberPad()}

        <TouchableOpacity 
          style={[styles.forgotPinButton, loading && styles.forgotPinButtonDisabled]} 
          onPress={handleForgotPin}
          activeOpacity={0.7}
          disabled={loading || biometricLoading}
        >
          <ThemedText style={[styles.forgotPinText, loading && styles.forgotPinTextDisabled]}>
            {loading ? 'Sending OTP...' : 'Forgot / Change PIN?'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAccountButton} onPress={handleSwitchAccount}>
          <ThemedText style={styles.switchAccountText}>Switch Account</ThemedText>
        </TouchableOpacity>

        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            Keep your PIN secure and don't share it with anyone
          </ThemedText>
        </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent', // Prevent flash of different background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  numberPad: {
    marginBottom: 30,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 30,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonEmpty: {
    backgroundColor: 'transparent',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  forgotPinButton: {
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  forgotPinButtonDisabled: {
    opacity: 0.6,
  },
  forgotPinText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPinTextDisabled: {
    color: '#666666',
  },
  switchAccountButton: {
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
  },
  switchAccountText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  // Biometric Authentication Styles
  biometricSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 10,
    minWidth: 200,
    gap: 10,
  },
  biometricButtonLoading: {
    opacity: 0.7,
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    flex: 1,
  },
  dividerText: {
    color: '#666666',
    fontSize: 14,
    marginHorizontal: 16,
    opacity: 0.7,
  },
});