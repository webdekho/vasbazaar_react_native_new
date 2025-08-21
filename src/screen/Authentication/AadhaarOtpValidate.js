import { AuthContext } from '../../context/AuthContext';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { verifyAadhaarOTP } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';

const { width, height } = Dimensions.get('window');

export default function AadhaarOtpValidateScreen({ route, navigation }) {
  // Removed expo-router usage
  const authContext = useContext(AuthContext);
  const { login, userData, updateUserData } = authContext;
  
  // State management
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  // Route params
  const aadhaar_number = route.params?.aadhaar_number || '';
  const sessionToken = route.params?.sessionToken || '';
  const ref_id = route.params?.ref_id || '';
  const permanentToken = route.params?.permanentToken || '';
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Input refs for OTP fields
  const inputRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef()]);

  // Component mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.current?.focus();
    }, 500);
  }, []);

  // Back button handler
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Go Back?', 
        'Are you sure you want to go back? Your Aadhaar verification will be cancelled.', 
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

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    // Allow only numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const updatedOtp = [...otp];
      updatedOtp[index] = numericValue;
      setOtp(updatedOtp);

      // Clear error when user starts typing
      if (errorMessage) {
        setErrorMessage('');
      }

      // Auto-focus next input
      if (numericValue && index < otp.length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.current?.focus();
          setFocusedIndex(index + 1);
        }, 50);
      }

      // Auto-submit when all fields are filled
      if (updatedOtp.every(digit => digit !== '') && updatedOtp.join('').length === 6) {
        // Small delay for better UX
        setTimeout(() => {
          handleSubmit(updatedOtp.join(''));
        }, 300);
      }
    }
  };

  // Handle backspace key
  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        setTimeout(() => {
          inputRefs.current[index - 1]?.current?.focus();
          setFocusedIndex(index - 1);
        }, 50);
      } else if (otp[index]) {
        // Clear current input
        const updatedOtp = [...otp];
        updatedOtp[index] = '';
        setOtp(updatedOtp);
      }
    }
  };

  // Handle input focus
  const handleFocus = (index) => {
    setFocusedIndex(index);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Validate OTP
  const validateOtp = (otpString) => {
    if (!otpString || otpString.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpString)) {
      setErrorMessage('OTP must contain only numbers');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = (otpString = null) => {
    const enteredOtp = otpString || otp.join('');
    
    if (!validateOtp(enteredOtp)) {
      return;
    }
    
    setErrorMessage('');
    verifyOTP(enteredOtp, ref_id, sessionToken);
  };

  // Verify Aadhaar OTP API call
  const verifyOTP = async (otpCode, ref_id, sessionToken) => {
    setLoading(true);
    
    try {
      const response = await verifyAadhaarOTP(otpCode, ref_id, sessionToken);
      console.log("Aadhaar OTP Verification Response", response);
      
      if (response?.status === 'success') {
        const data = response.data;
        const userData1 = {
          name: data.name,
          mobile: userData.mobile,
          city: userData.city,
          state: userData.state,
          userType: userData.userType
        };

        updateUserData(userData1);
        navigation.navigate('PinGenerate', {
          permanentToken: permanentToken,
          sessionToken: sessionToken,
          data: userData1
        });



      } else {
        setErrorMessage(response?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Aadhaar OTP Verification Error", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    setTimer(30);
    setIsResendEnabled(false);
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
    
    // Show success message
    Alert.alert(
      'OTP Sent',
      'A new OTP has been sent to your registered mobile number for Aadhaar verification.',
      [{ text: 'OK', onPress: () => {
        setTimeout(() => {
          inputRefs.current[0]?.current?.focus();
        }, 50);
      }}]
    );
  };

  // Clear OTP and start over
  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
    setTimeout(() => {
      inputRefs.current[0]?.current?.focus();
      setFocusedIndex(0);
    }, 50);
  };

  // Format Aadhaar number for display
  const formatAadhaarNumber = (number) => {
    if (number.length === 12) {
      return `XXXX XXXX ${number.slice(-4)}`;
    }
    return `XXXX XXXX ${number.slice(-4)}`;
  };

  // Check if OTP is complete
  const isOtpComplete = otp.every(digit => digit !== '');

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
          headerText="Verify OTP"
          headerTitle="Enter the OTP sent to your mobile"
        />

        {/* Form Section */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.content}>
            {/* Aadhaar Number Field */}
            <View style={styles.aadhaarContainer}>
              <PaperTextInput
                label="Aadhaar Number"
                value={formatAadhaarNumber(aadhaar_number)}
                mode="outlined"
                editable={false}
                style={styles.aadhaarInput}
                outlineStyle={styles.aadhaarInputOutline}
                theme={{
                  colors: {
                    primary: '#000000',
                    outline: '#D1D5DB',
                  }
                }}
                left={<PaperTextInput.Icon icon="card-account-details" />}
              />
            </View>

            {/* Header Text */}
            <Text style={styles.title}>Verify your Aadhaar OTP</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to your mobile</Text>

            {/* OTP Section */}
            <Animated.View 
              style={[
                styles.otpContainer,
              ]}
            >
              {otp.map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpInputWrapper,
                    focusedIndex === index && styles.otpInputWrapperFocused,
                    digit && styles.otpInputWrapperFilled,
                    errorMessage && styles.otpInputWrapperError,
                  ]}
                >
                  <TextInput
                    ref={inputRefs.current[index]}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={(event) => handleKeyPress(index, event)}
                    onFocus={() => handleFocus(index)}
                    onBlur={() => setFocusedIndex(-1)}
                    keyboardType="numeric"
                    maxLength={1}
                    returnKeyType={index === 5 ? 'done' : 'next'}
                    onSubmitEditing={() => {
                      if (index < 5) {
                        setTimeout(() => {
                          if (inputRefs.current[index + 1]?.current) {
                            inputRefs.current[index + 1].current.focus();
                          }
                        }, 50);
                      } else {
                        handleSubmit();
                      }
                    }}
                    textAlign="center"
                    selectTextOnFocus
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </View>
              ))}
            </Animated.View>

            {/* Error Message */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend OTP in {timer} seconds
                </Text>
              ) : (
                <Button
                  mode="text"
                  onPress={handleResendOtp}
                  disabled={!isResendEnabled}
                  style={styles.resendButton}
                  labelStyle={styles.resendButtonText}
                >
                  Resend OTP
                </Button>
              )}
            </View>

            {/* Submit Button */}
            <View style={styles.bottomContainer}>
              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                disabled={loading || !isOtpComplete}
                loading={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                labelStyle={styles.submitButtonText}
              >
                {loading ? 'Verifying...' : 'Verify now'}
              </Button>
            </View>
          </View>
        </Animated.View>
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
  // Main Content
  content: {
    flex: 1,
    paddingTop: height * 0.02,
    alignItems: 'center',
  },
  
  // Aadhaar Container
  aadhaarContainer: {
    width: '100%',
    marginBottom: height * 0.02,
  },
  aadhaarInput: {
    backgroundColor: '#FFFFFF',
  },
  aadhaarInputOutline: {
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  
  // Title and Subtitle
  title: {
    fontSize: width < 320 ? Math.max(width * 0.06, 20) : width < 350 ? Math.max(width * 0.065, 22) : Math.min(width * 0.07, 24),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: height * 0.005,
  },
  subtitle: {
    fontSize: width < 320 ? Math.max(width * 0.04, 14) : width < 350 ? Math.max(width * 0.045, 15) : Math.min(width * 0.05, 16),
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  
  // OTP Container
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.025,
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
  // Timer and Resend
  timerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  timerText: {
    fontSize: width < 320 ? Math.max(width * 0.035, 12) : width < 350 ? Math.max(width * 0.04, 13) : Math.min(width * 0.04, 14),
    color: '#8E8E93',
    textAlign: 'center',
  },
  resendButton: {
    borderRadius: 8,
  },
  resendButtonText: {
    fontSize: width < 320 ? Math.max(width * 0.035, 12) : width < 350 ? Math.max(width * 0.04, 13) : Math.min(width * 0.04, 14),
    fontWeight: '600',
    color: '#000000',
  },
  
  // Error Message
  errorText: {
    fontSize: width < 320 ? Math.max(width * 0.035, 12) : width < 350 ? Math.max(width * 0.04, 13) : Math.min(width * 0.04, 14),
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: height * 0.01,
  },
  
  // Bottom Container
  bottomContainer: {
    paddingHorizontal: width < 350 ? width * 0.04 : width * 0.05,
    paddingBottom: Platform.OS === 'ios' ? height * 0.03 : height * 0.015,
    paddingTop: height * 0.01,
  },
  submitButton: {
    borderRadius: width < 320 ? 12 : 16,
    backgroundColor: '#000000',
  },
  submitButtonContent: {
    paddingVertical: height * 0.012,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width < 320 ? Math.max(width * 0.04, 14) : width < 350 ? Math.max(width * 0.045, 15) : Math.min(width * 0.05, 16),
    fontWeight: '600',
  },
});