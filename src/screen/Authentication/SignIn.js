import { Ionicons } from '@expo/vector-icons';
// Removed expo-router import
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import SimpleCustomInput from '../../components/SimpleCustomInput';
import { sendOTP } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';
import ReferralCodeManager from '../../utils/ReferralCodeManager';

const { width, height } = Dimensions.get('window');


export default function SignInScreen({ navigation, route }) {
  const code = route?.params?.code;
  
  // State management
  const [mobile, setMobile] = useState('');
  const [referralCode, setReferralCode] = useState(code || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferralField, setShowReferralField] = useState(!!code);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Input refs for managing focus
  const mobileInputRef = useRef(null);
  const referralInputRef = useRef(null);

  // Component mount animation and referral code initialization
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

    // Initialize referral code from URL or storage
    const initializeReferralCode = async () => {
      try {
        const urlCode = await ReferralCodeManager.initialize();
        if (urlCode && !referralCode) {
          setReferralCode(urlCode);
          setShowReferralField(true);
          console.log('Initialized referral code from URL/storage:', urlCode);
        }
      } catch (error) {
        console.error('Error initializing referral code:', error);
      }
    };

    initializeReferralCode();
  }, []);

  // Mobile number input handler with validation
  const handleMobileChange = (text) => {
    // Allow only numbers and limit to 10 digits
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(filtered);
    
    // Clear error when user types valid input (debounced to prevent focus loss)
    if (filtered.length === 10 && errorMessage) {
      setTimeout(() => setErrorMessage(''), 0);
    } else if (errorMessage && filtered.length > 0) {
      setTimeout(() => setErrorMessage(''), 0);
    }
  };

  // Referral code input handler
  const handleReferralChange = (text) => {
    // Allow alphanumeric characters and limit to 15 characters
    const filtered = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
    setReferralCode(filtered);
  };

  // Validate mobile number
  const validateMobileNumber = () => {
    if (!mobile.trim()) {
      setErrorMessage('Mobile number is required');
      return false;
    }
    
    if (mobile.length !== 10) {
      setErrorMessage('Mobile number must be exactly 10 digits');
      return false;
    }
    
    // Basic Indian mobile number validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      setErrorMessage('Please enter a valid Indian mobile number');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateMobileNumber()) {
      return;
    }
    
    setErrorMessage('');
    await sendLoginOTP(mobile);
  };

  // Send OTP API call
  const sendLoginOTP = async (mobileNumber) => {
    setLoading(true);
    
    try {
      const response = await sendOTP(mobileNumber);
      console.log("Login API Response", response);
      
      if (response?.status === 'success') {
        // Save referral code before navigation
        if (referralCode) {
          await ReferralCodeManager.storeReferralCode(referralCode);
        }
        
        // Navigate to OTP validation screen
        navigation.navigate('otp_validate', {
          response: response.data,
          mobileNumber: mobileNumber,
          code: referralCode,
        });
      } else {
        setErrorMessage(response?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle referral code field visibility
  const toggleReferralField = () => {
    setShowReferralField(!showReferralField);
    if (!showReferralField) {
      setTimeout(() => referralInputRef.current?.focus(), 300);
    }
  };

  // Clear error message when user starts typing
  const handleFocus = () => {
    // Paper handles focus styling automatically
  };

  // Handle blur 
  const handleBlur = () => {
    // Paper handles blur styling automatically
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* Top Auth Header */}
        <TopAuthHeader 
          headerText="Load your vasbazaar wallet with a Credit Card" 
          headerTitle="Recharge using Credit Card" 
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/vasbazaar_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.subWelcomeText}>
            Enter your mobile number to get started
          </Text>

          {/* Mobile Number Input */}
          <SimpleCustomInput
            ref={mobileInputRef}
            label="Enter Mobile Number"
            value={mobile}
            onChangeText={handleMobileChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Enter mobile number"
            returnKeyType="next"
            mode="outlined"
            usePaperInput={true}
            errorText={errorMessage}
            leftIcon={{ name: "phone", size: 20 }}
            rightIcon={mobile.length === 10 ? { name: "check-circle", size: 20 } : null}
            onSubmitEditing={() => {
              if (showReferralField) {
                referralInputRef.current?.focus();
              } else {
                handleSubmit();
              }
            }}
            containerStyle={styles.inputContainer}
            paperTheme={{
              colors: {
                primary: '#000000',
                outline: '#CCCCCC',
              }
            }}
          />

          {/* Referral Code Input */}
          {showReferralField && (
            <Animated.View>
              <SimpleCustomInput
                ref={referralInputRef}
                label={`Referral Code ${!code ? '(Optional)' : ''}`}
                value={referralCode}
                onChangeText={handleReferralChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Enter referral code"
                maxLength={15}
                autoCapitalize="characters"
                returnKeyType="done"
                mode="outlined"
                usePaperInput={true}
                rightIcon={referralCode.length > 0 ? { name: "close-circle", onPress: () => setReferralCode('') } : null}
                onSubmitEditing={handleSubmit}
                containerStyle={styles.inputContainer}
                paperTheme={{
                  colors: {
                    primary: '#000000',
                    outline: '#CCCCCC',
                  }
                }}
              />
            </Animated.View>
          )}

          {/* Toggle Referral Code Button */}
          {!code && (
            <TouchableOpacity 
              style={styles.referralToggle}
              onPress={toggleReferralField}
            >
              <Ionicons 
                name={showReferralField ? "remove-circle-outline" : "add-circle-outline"} 
                size={16} 
                color="#000000" 
              />
              <Text style={styles.referralToggleText}>
                {showReferralField ? 'Remove referral code' : 'Have a referral code?'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Error Message */}
          <View style={[styles.errorContainer, !errorMessage && styles.errorContainerHidden]}>
            {errorMessage ? (
              <>
                <Ionicons name="alert-circle" size={16} color="#FF0000" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              mobile.length === 10 && styles.submitButtonEnabled
            ]}
            onPress={handleSubmit}
            disabled={loading || mobile.length !== 10}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Sending OTP...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.submitButtonText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>

        </Animated.View>

        {/* Footer */}
        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact our support team
          </Text>
        </View> */}
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
    paddingTop: 30,
    paddingHorizontal: 20,
    minHeight: height * 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: Math.min(width * 0.55, 220),
    height: Math.min(height * 0.12, 100),
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 6,
  },
  subWelcomeText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },
  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  paperInput: {
    backgroundColor: '#FFFFFF',
  },
  // Referral Toggle
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    // marginBottom: 20,
    padding: 8,
  },
  referralToggleText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
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
    minHeight: 44,
  },
  errorContainerHidden: {
    backgroundColor: 'transparent',
    borderLeftWidth: 0,
    paddingVertical: 0,
    minHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF0000',
    marginLeft: 8,
    flex: 1,
  },
  // Submit Button
  submitButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  // Info Text
  infoText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});