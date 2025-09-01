import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions, StatusBar, View, ScrollView, Text, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Logo from '@/components/Logo';
import { sendLoginOtp } from '../../services';

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [mobileNumber, setMobileNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferralField, setShowReferralField] = useState(false);
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Check for referral code in URL query parameters
  React.useEffect(() => {
    console.log('LoginScreen searchParams:', searchParams);
    const code = searchParams.code;
    if (code) {
      console.log('Setting referral code:', code);
      setReferralCode(code);
      setIsReferralFromUrl(true);
      // Hide the referral field when it comes from URL
      setShowReferralField(false);
    }
  }, [searchParams.code]);

  const validateMobile = () => {
    const newErrors = {};
    if (!mobileNumber) {
      newErrors.mobile = 'Mobile number is required';
    } else if (mobileNumber.length !== 10) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    } else if (!/^\d+$/.test(mobileNumber)) {
      newErrors.mobile = 'Mobile number must contain only digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send OTP API call
  const handleLogin = async () => {
    if (!validateMobile()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await sendLoginOtp(mobileNumber, referralCode);

      if (response?.status === 'success') {
        // Navigate to OTP screen with response data
        router.push({
          pathname: '/auth/OtpScreen',
          params: { 
            mobileNumber,
            referralCode: referralCode || undefined,
            token: response.data || undefined
          }
        });
      } else {
        setErrors({ general: response?.message || 'Failed to send OTP. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Header Section with Background Image */}
        <ThemedView style={styles.header}>
          <Image 
            source={require('@/assets/images/vas.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* <ThemedView style={styles.overlay} /> */}
          
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
          <ThemedText style={styles.welcomeSubtitle}>Login to your account</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputGroup}>
            <View
              style={[
                styles.mobileInputContainer,
                isMobileFocused && styles.mobileInputContainerFocused,
                errors.mobile && styles.inputError
              ]}
            >
              <Text style={styles.prefixText}>+91 </Text>
              <TextInput
                ref={inputRef}
                style={styles.mobileInput}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onFocus={() => setIsMobileFocused(true)}
                onBlur={() => setIsMobileFocused(false)}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus={true}
                placeholder="Enter mobile number"
                placeholderTextColor="#9CA3AF"
                selectionColor="#000000"
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={styles.errorContainer}>
              {errors.mobile && (
                <ThemedText style={styles.errorText}>{errors.mobile}</ThemedText>
              )}
            </View>
          </ThemedView>

          {/* Referral Code Field - Hidden by default, shown via URL parameter */}
          {showReferralField && (
            <ThemedView style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Referral Code (Optional)"
                placeholderTextColor="#9CA3AF"
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                maxLength={20}
              />
            </ThemedView>
          )}

          {/* Show/Hide Referral Code Toggle - Only show if referral is not from URL */}
          {showReferralField && !isReferralFromUrl && (
            <TouchableOpacity 
              style={styles.referralToggle}
              onPress={() => setShowReferralField(true)}
            >
              <ThemedText style={styles.referralToggleText}>
                Have a referral code?
              </ThemedText>
            </TouchableOpacity>
          )}

          <View style={styles.errorContainer}>
            {errors.general && (
              <ThemedText style={styles.errorText}>{errors.general}</ThemedText>
            )}
          </View>

          {/* Login Button with keyboard-aware positioning */}
          <View style={[
            styles.buttonContainer, 
            { 
              marginTop: 16, // Reduced from 24 to 16
              marginBottom: keyboardHeight > 0 ? 20 : Math.max(insets.bottom, 20),
              paddingBottom: keyboardHeight > 0 ? 10 : 0,
            }
          ]}>
            <TouchableOpacity 
              style={[
                styles.loginButton, 
                (mobileNumber.length !== 10 || loading) && styles.loginButtonDisabled
              ]} 
              onPress={handleLogin}
              disabled={mobileNumber.length !== 10 || loading}
            >
              <ThemedText style={styles.loginButtonText}>
                {loading ? 'Sending OTP...' : 'Login'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  logoContainer: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },


  // Form Section
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
    minHeight: 400, // Ensure form has minimum height but allows scrolling
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24, // Reduced from 40 to 24
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Form Styles
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24, // Same as welcomeSection marginBottom
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 8, // Add some vertical padding for better cursor visibility
  },
  mobileInputContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  mobileInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0, // Remove default padding to align with container
    textAlign: 'left',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorContainer: {
    minHeight: 20, // Reserve space for error messages to prevent layout shifts
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },

  // Button Container (inside scroll view)
  buttonContainer: {
    paddingHorizontal: 0, // No extra padding since it's inside form container
    paddingTop: 0,
  },
  
  // Login Button
  loginButton: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },


  // Referral Code Styles
  referralToggle: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  referralToggleText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});