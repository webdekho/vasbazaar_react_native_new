import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, View, Image, Dimensions, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Logo from '@/components/Logo';
import ErrorMessage from '@/components/ErrorMessage';
import SuccessMessage from '@/components/SuccessMessage';
import { verifyAadhaarOtp, sendAadhaarOtp } from '../../services/aadhaar/aadhaarService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');

export default function AadhaarOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatAadhaarForDisplay = (aadhaarNumber) => {
    if (!aadhaarNumber) return '';
    return `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;
  };

  const handleOtpChange = (text, index) => {
    if (text.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Clear error and success messages when user starts typing
      if (errorMessage) {
        setErrorMessage('');
      }
      if (successMessage) {
        setSuccessMessage('');
      }

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

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      return;
    }

    // Clear previous error messages
    setErrorMessage('');

    setIsVerifying(true);

    try {
      // Get permanent token for API authentication
      const sessionToken = params.sessionToken;
      
      if (!sessionToken) {
        setErrorMessage('Authentication token not found. Please login again.');
        setTimeout(() => router.push('/auth/LoginScreen'), 2000);
        return;
      }

      const refId = params.ref_id;
      if (!refId) {
        setErrorMessage('Reference ID not found. Please try again.');
        setTimeout(() => router.push('/auth/AadhaarScreen'), 2000);
        return;
      }

      console.log('Verifying Aadhaar OTP:', { otpLength: otpString.length, refId });

      const response = await verifyAadhaarOtp(otpString, refId, sessionToken);

      console.log('Aadhaar OTP Verification Response:', response);

      // Check for success - handle both status and Status fields
      const isSuccess = response?.status === 'success' || response?.Status === 'SUCCESS';

      if (isSuccess) {
        console.log('Aadhaar OTP verified successfully');
        
        // Store Aadhaar verification data if needed
        // if (response.data) {
        //   await AsyncStorage.setItem('aadhaarData', JSON.stringify(response.data));
        //   console.log('Aadhaar data stored:', response.data.name);
        // }

        // Update userData with verified status
        try {
          if (response.data) {
            const aadhaarData = response.data;
            aadhaarData.verified_status = 1; // Set verification status to 1 (verified)
            await AsyncStorage.setItem('userData', JSON.stringify(aadhaarData));
            console.log('Updated userData with verified_status = 1', aadhaarData);
          } else {
            console.log('No response data found');
          }
        } catch (error) {
          console.error('Error updating userData verified_status:', error);
        }
        
        // Navigate to PIN setup screen with all required data
        router.push({
          pathname: '/auth/PinSetScreen',
          params: {
            mobileNumber: params.mobileNumber,
            aadhaarNumber: params.aadhaarNumber,
            referralCode: params.referralCode || undefined,
            aadhaarVerified: 'true',
            sessionToken: params.sessionToken
          }
        });
      } else {
        // Handle API failure - check both message fields and provide user-friendly messages
        const errorMessage = response?.message || response?.Message || 'Invalid OTP. Please try again.';
        const statusCode = response?.StatusCode || response?.statusCode;
        
        console.error('Aadhaar OTP Verification Failed:', {
          status: response?.Status || response?.status,
          statusCode: statusCode,
          message: errorMessage,
          fullResponse: response
        });

        // Display the raw API response message
        console.log('Setting error message to:', errorMessage);
        console.log('Original API message field:', response?.message);
        console.log('Full response object:', JSON.stringify(response));
        setErrorMessage(errorMessage);
        
        // Clear OTP for retry
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying Aadhaar OTP:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer !== 0 || isResending) return;

    setIsResending(true);

    try {
      // Get permanent token for API authentication
      const sessionToken = params.sessionToken;
      
      if (!sessionToken) {
        // Alert.alert('Error', 'Authentication token not found. Please login again.');
        router.push('/auth/LoginScreen');
        return;
      }

      const aadhaarNumber = params.aadhaarNumber;
      if (!aadhaarNumber) {
        // Alert.alert('Error', 'Aadhaar number not found. Please try again.');
        router.push('/auth/AadhaarScreen');
        return;
      }

      console.log('Resending Aadhaar OTP for:', aadhaarNumber);

      const response = await sendAadhaarOtp(aadhaarNumber, sessionToken);

      console.log('Resend OTP Response:', response);

      // Check for success - handle both status and Status fields
      const isSuccess = response?.status === 'success' || response?.Status === 'SUCCESS';

      if (isSuccess) {
        console.log('OTP resent successfully, new ref_id:', response.ref_id);
        
        // Update the ref_id parameter for this screen
        router.setParams({ ...params, ref_id: response.ref_id });
        
        // Reset timer
        setTimer(30);
        
        setSuccessMessage('OTP has been resent successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        // Handle failure response
        const errorMessage = response?.message || response?.Message || 'Failed to resend OTP. Please try again.';
        
        console.error('Failed to resend OTP:', {
          status: response?.Status || response?.status,
          statusCode: response?.StatusCode || response?.statusCode,
          message: errorMessage,
          fullResponse: response
        });

        setErrorMessage(`Failed to resend OTP: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error resending Aadhaar OTP:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsResending(false);
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
            <ThemedText style={styles.welcomeTitle}>Aadhaar OTP</ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              Enter the 6-digit OTP sent to your registered mobile number for Aadhaar {formatAadhaarForDisplay(params.aadhaarNumber)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            {/* Error Message */}
            

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

              <ErrorMessage message={errorMessage} visible={!!errorMessage} />
            
            {/* Success Message */}
            <SuccessMessage message={successMessage} visible={!!successMessage} />

              <ThemedView style={styles.timerContainer}>
                {timer > 0 ? (
                  <ThemedText style={styles.timerText}>Resend OTP in {timer}s</ThemedText>
                ) : (
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleResendOtp}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <ThemedView style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" style={styles.loadingSpinner} />
                        <ThemedText style={styles.resendText}>Resending...</ThemedText>
                      </ThemedView>
                    ) : (
                      <ThemedText style={styles.resendText}>Resend OTP</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              </ThemedView>
            </ThemedView>

            <TouchableOpacity 
              style={[
                styles.button, 
                (!isOtpComplete || isVerifying) && styles.buttonDisabled
              ]} 
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || isVerifying}
            >
              {isVerifying ? (
                <ThemedView style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.loadingSpinner} />
                  <ThemedText style={styles.buttonText}>Verifying...</ThemedText>
                </ThemedView>
              ) : (
                <ThemedText style={styles.buttonText}>Verify & Continue</ThemedText>
              )}
            </TouchableOpacity>

            <ThemedView style={styles.signupContainer}>
              <ThemedText style={styles.signupText}>
                OTP is sent to your Aadhaar registered mobile number for secure identity verification
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  loadingSpinner: {
    marginRight: 8,
  },
});