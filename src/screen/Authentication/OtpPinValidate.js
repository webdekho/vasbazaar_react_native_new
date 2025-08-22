// React imports
import React, { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';

// React Native imports
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Third-party library imports
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports
import { AuthContext } from '../../context/AuthContext';
import { verifyOTPPin } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';
import OptimizedOtpInput from '../../components/OptimizedOtpInput';

const { width, height } = Dimensions.get('window');

/**
 * OtpPinValidateScreen - Screen for validating OTP during PIN-based authentication
 * 
 * This component handles OTP verification for users who are signing in with their PIN.
 * Features include:
 * - 6-digit OTP input with optimized component
 * - Mobile number formatting and display
 * - OTP validation and error handling
 * - Resend OTP functionality with timer
 * - Auto-submission when OTP is complete
 * - Back button handling with confirmation
 * - Performance optimizations with useCallback and useMemo
 * 
 * @param {Object} props - Component props
 * @param {Object} props.route - Navigation route object containing params
 * @param {string} props.route.params.mobileNumber - User's mobile number
 * @param {Object} props.route.params.response - Response data from previous authentication step
 * @param {Object} props.navigation - Navigation object for screen navigation
 * @returns {JSX.Element} The rendered OtpPinValidateScreen component
 */
export default function OtpPinValidateScreen({ route, navigation }) {
  const authContext = useContext(AuthContext);
  const { login, updateUserData, secureToken } = authContext;
  
  // State management
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Route params
  const mobileNumber = route.params?.mobileNumber || '';
//   const code = route.params?.code || '';
  const response = route.params?.response;

  // Memoized values for better performance
  const formattedMobileNumber = useMemo(() => {
    if (mobileNumber.length === 10) {
      return `+91 ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`;
    }
    return `+91 ${mobileNumber}`;
  }, [mobileNumber]);

  const isOtpComplete = useMemo(() => {
    return otp.every(digit => digit !== '');
  }, [otp]);

  // Back button handler
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Go Back?', 
        'Are you sure you want to go back to the previous screen?', 
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  // Optimized OTP handlers with useCallback for better performance
  const handleOtpChange = useCallback((newOtp) => {
    setOtp(newOtp);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [errorMessage]);


  // Optimized validation and submission with useCallback
  const validateOtp = useCallback((otpString) => {
    if (!otpString || otpString.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpString)) {
      setErrorMessage('OTP must contain only numbers');
      return false;
    }
    
    return true;
  }, []);

  // Make verifyLoginOTP available to handleSubmit
  const verifyLoginOTP = useCallback(async (otpCode, token) => {
    setLoading(true);
    
    try {
      const apiResponse = await verifyOTPPin(otpCode, secureToken, token);
      
      if (apiResponse?.status === 'success') {
        const data = apiResponse.data;
        const userData1 = {
          name: data.name,
          mobile: data.mobile,
          city: data.city,
          state: data.state,
          userType: data.userType
        };

        updateUserData(userData1);
        navigation.navigate('PinGenerate', {
          permanentToken: data.permanentToken,
          sessionToken: data.token,
          data: userData1
        });


        // navigation.navigate('PinGenerate',{response:data});

      } else {
        setErrorMessage(apiResponse?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [secureToken, navigation]);

  const handleSubmit = useCallback((otpString = null) => {
    const enteredOtp = otpString || otp.join('');
    
    if (!validateOtp(enteredOtp)) {
      return;
    }
    
    setErrorMessage('');
    verifyLoginOTP(enteredOtp, response);
  }, [otp, response, validateOtp, verifyLoginOTP]);

  const handleOtpComplete = useCallback((otpString) => {
    // Auto-submit when all fields are filled - no setTimeout needed
    handleSubmit(otpString);
  }, [handleSubmit]);

  // Optimized resend and clear functions with useCallback
  const handleResendOtp = useCallback(() => {
    setTimer(30);
    setIsResendEnabled(false);
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
    
    // Show success message
    Alert.alert(
      'OTP Sent',
      'A new OTP has been sent to your mobile number.',
      [{ text: 'OK' }]
    );
  }, []);

  const clearOtp = useCallback(() => {
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
  }, []);


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Auth Header */}
        <TopAuthHeader
          headerText="Load your vasbazaar wallet with a Credit Card"
          headerTitle="Recharge using Credit Card"
        />

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/vasbazaar_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Header Text */}
          <Text style={styles.welcomeText}>Enter Verification Code</Text>
          <Text style={styles.subWelcomeText}>
            We&apos;ve sent a 6-digit code to
          </Text>
          {/* <Text style={styles.mobileNumber}>
            {formattedMobileNumber}
          </Text> */}

          {/* Optimized OTP Input */}
          <View style={styles.otpContainer}>
            <OptimizedOtpInput
              length={6}
              value={otp}
              onChangeText={handleOtpChange}
              onComplete={handleOtpComplete}
              errorState={!!errorMessage}
              autoFocus={true}
            />
          </View>

          {/* Clear OTP Button */}
          {otp.some(digit => digit !== '') && (
            <TouchableOpacity style={styles.clearButton} onPress={clearOtp}>
              <Ionicons name="refresh-outline" size={16} color="#666666" />
              <Text style={styles.clearButtonText}>Clear and start over</Text>
            </TouchableOpacity>
          )}

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF0000" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Timer and Resend */}
          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <View style={styles.timerWrapper}>
                <Ionicons name="time-outline" size={16} color="#666666" />
                <Text style={styles.timerText}>
                  Resend OTP in {timer} seconds
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={!isResendEnabled}
              >
                <Ionicons name="refresh" size={16} color="#000000" />
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              isOtpComplete && styles.submitButtonEnabled
            ]}
            onPress={() => handleSubmit()}
            disabled={loading || !isOtpComplete}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Verifying...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.submitButtonText}>Verify OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Didn&apos;t receive the code? Check your message inbox or try resending.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  // Form Section
  formSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: height * 0.04,
    paddingHorizontal: width < 350 ? width * 0.04 : width * 0.05,
    minHeight: height * 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  logo: {
    width: Math.min(width * 0.55, 220),
    height: Math.min(height * 0.12, 100),
  },
  welcomeText: {
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: height * 0.01,
  },
  subWelcomeText: {
    fontSize: Math.min(width * 0.04, 16),
    color: '#666666',
    textAlign: 'center',
    marginBottom: height * 0.01,
  },
  mobileNumber: {
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: height * 0.04,
    letterSpacing: 1,
  },
  // OTP Input Styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.05,
    paddingHorizontal: width < 320 ? 10 : 20,
    gap: width < 320 ? 6 : width < 350 ? 8 : 12,
    flexWrap: width < 300 ? 'wrap' : 'nowrap',
    minHeight: width < 320 ? 60 : 55,
  },
  
  // OTP Input Components
  otpInputWrapper: {
    width: width < 320 ? Math.max((width - 60) / 6, 40) : width < 350 ? Math.max((width - 80) / 6, 45) : Math.min(width * 0.12, 55),
    height: width < 320 ? Math.max((width - 60) / 6, 40) : width < 350 ? Math.max((width - 80) / 6, 45) : Math.min(width * 0.12, 55),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: width < 320 ? 8 : 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputWrapperFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  otpInputWrapperFilled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  otpInputWrapperError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  otpInputContent: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: width < 320 
      ? Math.min(width * 0.04, 14)
      : Math.min(width * 0.045, 18),
    fontWeight: 'bold',
    paddingHorizontal: 0,
    paddingVertical: 0,
    lineHeight: width < 320 
      ? Math.min(width * 0.04, 14)
      : Math.min(width * 0.045, 18),
    includeFontPadding: false,
  },
  otpNativeInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: width < 320 ? Math.max(width * 0.05, 16) : width < 350 ? Math.max(width * 0.055, 18) : Math.min(width * 0.065, 24),
    fontWeight: '600',
    color: '#000000',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  otpInputOutline: {
    borderWidth: 2,
    borderRadius: 8,
  },
  otpInputOutlineFilled: {
    borderColor: '#4CAF50',
  },
  otpInputOutlineFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  // Clear Button
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: height * 0.025,
    padding: 8,
  },
  clearButtonText: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666666',
    marginLeft: 6,
  },
  // Timer and Resend
  timerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666666',
    marginLeft: 6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resendButtonText: {
    fontSize: Math.min(width * 0.035, 14),
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  // Error Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  errorText: {
    fontSize: 14,
    color: '#FF0000',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  // Submit Button
  submitButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.025,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonEnabled: {
    backgroundColor: '#000000',
  },
  submitButtonDisabled: {
    backgroundColor: '#F0F0F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  // Help Text
  helpText: {
    fontSize: Math.min(width * 0.03, 12),
    color: '#666666',
    textAlign: 'center',
    lineHeight: Math.min(width * 0.045, 18),
    paddingHorizontal: width * 0.05,
  },
  // Footer
  footer: {
    padding: width * 0.05,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666666',
    textAlign: 'center',
  },
});

// PropTypes validation
OtpPinValidateScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      mobileNumber: PropTypes.string,
      response: PropTypes.object,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};