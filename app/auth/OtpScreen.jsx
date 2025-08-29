import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, View, Image, Dimensions, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Logo from '@/components/Logo';
import { verifyLoginOtp, sendLoginOtp } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSessionToken } from '../../services/auth/sessionManager';
import { useAuth } from '../hooks/useAuth';

const { height: screenHeight } = Dimensions.get('window');

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshAuth } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (text, index) => {
    if (text.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Move to next input
      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Verify OTP API call
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMessage('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const apiResponse = await verifyLoginOtp(
        otpString, 
        params.referralCode, 
        params.token
      );

      if (apiResponse?.status === 'success') {
        const data = apiResponse.data;
        const sessionToken = data.token;
        const permanentToken = data.permanentToken;
        const verified_status = data.verified_status;
        const pin = data.pin;

        const userData = {
          refferalCode: data.refferalCode,
          verified_status,
          name: data.name,
          mobile: data.mobile,
          city: data.city,
          state: data.state,
          userType: data.userType
        };

        // Save profile photo
        if (data.profile) {
          await AsyncStorage.setItem("profile_photo", data.profile);
        }

        // Route based on verification status and PIN
        if (verified_status !== 1) {
          // Save user data and tokens for Aadhaar verification
          await saveSessionToken(sessionToken); // Auto-expires in 10 minutes
          await AsyncStorage.setItem('permanentToken', permanentToken); // Save permanent token
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          router.push({
            pathname: '/auth/AadhaarScreen',
            params: {
              permanentToken,
              sessionToken,
            }
          });
          return;
        }

        if (pin === null) {
          // Save user data and tokens for PIN setup
          await saveSessionToken(sessionToken); // Auto-expires in 10 minutes
          await AsyncStorage.setItem('permanentToken', permanentToken); // Save permanent token
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          router.push({
            pathname: '/auth/PinSetScreen',
            params: {
              permanentToken,
              sessionToken,
            }
          });
          return;
        }

        // Complete login - save tokens with expiration and navigate to main app
        console.log('OTP Validation Success - Saving tokens:', {
          sessionToken: sessionToken?.substring(0, 20) + '...',
          permanentToken: permanentToken?.substring(0, 20) + '...',
          userData: userData
        });
        
        await saveSessionToken(sessionToken); // Auto-expires in 10 minutes
        await AsyncStorage.setItem('permanentToken', permanentToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Set flag to bypass AuthGuard temporarily
        await AsyncStorage.setItem('otpValidationSuccess', 'true');
        
        console.log('OTP Validation - Tokens saved, refreshing auth state');
        
        // Use setTimeout to ensure all async operations complete
        setTimeout(async () => {
          try {
            // Refresh auth state first
            console.log('OTP Validation - Calling refreshAuth');
            await refreshAuth();
            console.log('OTP Validation - Auth refreshed, navigating to home');
            
            // Clear the bypass flag after a delay
            setTimeout(() => {
              AsyncStorage.removeItem('otpValidationSuccess');
            }, 1000);
            
            // Navigate to home
            router.replace('/(tabs)/home');
          } catch (error) {
            console.error('OTP Validation - Error during refresh/navigation:', error);
          }
        }, 500);
        
      } else {
        setErrorMessage(apiResponse?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP API call
  const handleResendOtp = async () => {
    if (timer === 0) {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await sendLoginOtp(
          params.mobileNumber, 
          params.referralCode
        );

        if (response?.status === 'success') {
          setTimer(30);
          setOtp(['', '', '', '', '', '']);
          Alert.alert('Success', 'OTP sent successfully');
        } else {
          setErrorMessage(response?.message || 'Failed to resend OTP');
        }
      } catch (error) {
        setErrorMessage('Failed to resend OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section with Background Image */}
        <ThemedView style={styles.header}>
          <Image 
            source={require('@/assets/images/vas.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <ThemedView style={styles.overlay} />
        </ThemedView>

        {/* Form Section */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.logoSection}>
            <Logo 
              size="xxlarge"
              variant="default"
              source={require('@/assets/images/vasbazaar_logo.png')}
              resizeMode="contain"
              style={styles.logoContainer}
            />
          </ThemedView>
          
          <ThemedView style={styles.welcomeSection}>
            <ThemedText style={styles.welcomeTitle}>Enter OTP</ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              We've sent a 6-digit OTP to +91 {params.mobileNumber || 'your number'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.otpContainer}>
              <View style={styles.otpInputs}>
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpInputWrapper,
                      focusedIndex === index && styles.otpInputWrapperFocused
                    ]}
                  >
                    <TextInput
                      ref={ref => inputRefs.current[index] = ref}
                      style={styles.otpInputField}
                      value={digit}
                      onChangeText={text => handleOtpChange(text, index)}
                      onKeyPress={e => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(-1)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectionColor="#000000"
                      underlineColorAndroid="transparent"
                      textContentType="oneTimeCode"
                    />
                  </View>
                ))}
              </View>

              <ThemedView style={styles.timerContainer}>
                {timer > 0 ? (
                  <ThemedText style={styles.timerText}>Resend OTP in {timer}s</ThemedText>
                ) : (
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleResendOtp}
                    disabled={loading}
                  >
                    <ThemedText style={styles.resendText}>
                      {loading ? 'Sending...' : 'Resend OTP'}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            </ThemedView>

            {errorMessage ? (
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            ) : null}

            <TouchableOpacity 
              style={[
                styles.button, 
                (!isOtpComplete || loading) && styles.buttonDisabled
              ]} 
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || loading}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedView style={styles.signupContainer}>
              <ThemedText style={styles.signupText}>
                Didn't receive OTP? Check your SMS / Whatsapp or try again
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },

  // Header Section with Background Image
  header: {
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Form Section
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form Styles
  form: {
    flex: 1,
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  otpInputWrapper: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  otpInputWrapperFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  otpInputField: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#111827',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Verify Button
  button: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Footer Section
  signupContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Error message style
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});