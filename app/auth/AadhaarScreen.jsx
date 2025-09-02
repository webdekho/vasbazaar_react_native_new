import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Logo from '@/components/Logo';
import { sendAadhaarOtp } from '../../services/aadhaar/aadhaarService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');

export default function AadhaarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarFocused, setIsAadhaarFocused] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Debug component mount and params
  React.useEffect(() => {
    const checkTokens = async () => {
      const permanentTokenFromStorage = await AsyncStorage.getItem('permanentToken');
      const sessionTokenFromStorage = await AsyncStorage.getItem('sessionToken');
      
      console.log('AadhaarScreen - Component mounted with params:', {
        hasParams: !!params,
        paramsKeys: Object.keys(params),
        permanentTokenFromParams: params.permanentToken ? 'present' : 'missing',
        sessionTokenFromParams: params.sessionToken ? 'present' : 'missing',
        permanentTokenFromStorage: permanentTokenFromStorage ? 'present' : 'missing',
        sessionTokenFromStorage: sessionTokenFromStorage ? 'present' : 'missing'
      });
    };
    
    checkTokens();
  }, [params]);

  const formatAadhaarNumber = (text) => {
    // Remove all non-digits and format as XXXX-XXXX-XXXX
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    return formatted;
  };

  const validateAadhaar = () => {
    const newErrors = {};
    const cleanNumber = aadhaarNumber.replace(/-/g, '');
    
    if (!aadhaarNumber) {
      newErrors.aadhaar = 'Aadhaar number is required';
    } else if (cleanNumber.length !== 12) {
      newErrors.aadhaar = 'Aadhaar number must be 12 digits';
    } else if (!/^\d+$/.test(cleanNumber)) {
      newErrors.aadhaar = 'Aadhaar number must contain only digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAadhaarChange = (text) => {
    const formatted = formatAadhaarNumber(text);
    if (formatted.replace(/-/g, '').length <= 12) {
      setAadhaarNumber(formatted);
      // Clear API error when user starts typing
      if (apiError) {
        setApiError('');
      }
    }
  };

  // Check if form is complete
  const isComplete = aadhaarNumber.replace(/-/g, '').length === 12;

  const handleSendAadhaarOtp = async () => {
    if (!validateAadhaar()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(''); // Clear any previous API errors

    try {
      // Get permanent token for API authentication
      
      console.log('AadhaarScreen - handleSendAadhaarOtp debug:', {
        hasPermanentToken: !!params.sessionToken,
        tokenLength: params.sessionToken?.length,
        aadhaarLength: aadhaarNumber.length
      });
      
      if (!params.sessionToken) {
        console.log('AadhaarScreen - No permanent token found, redirecting to login');
        setApiError('Authentication token not found. Please login again.');
        setIsLoading(false);
        return;
      }

      const cleanAadhaarNumber = aadhaarNumber.replace(/-/g, '');
      console.log('AadhaarScreen - About to call sendAadhaarOtp:', {
        cleanAadhaarNumber,
        hasToken: !!params.sessionToken
      });

      const response = await sendAadhaarOtp(cleanAadhaarNumber, params.sessionToken);
      
      console.log('AadhaarScreen - API response received:', {
        status: response?.status,
        Status: response?.Status,
        message: response?.message,
        ref_id: response?.ref_id,
        hasData: !!response?.data,
        StatusCode: response?.StatusCode
      });

      // Check for success (handle both 'status' and 'Status' fields)
      const isSuccess = response?.status?.toLowerCase() === 'success' || 
                       response?.Status?.toLowerCase() === 'success';

      if (isSuccess) {
        console.log('AadhaarScreen - OTP sent successfully, ref_id:', response.ref_id);
        
        // Navigate to Aadhaar OTP screen with ref_id
        router.push({
          pathname: '/auth/AadhaarOtpScreen',
          params: { 
            aadhaarNumber: cleanAadhaarNumber,
            mobileNumber: params.mobileNumber,
            referralCode: params.referralCode || undefined,
            ref_id: response.ref_id,
            sessionToken: params.sessionToken
          }
        });
      } else {
        // Handle API error with improved error messages
        console.error('AadhaarScreen - Failed to send OTP:', {
          status: response?.status,
          Status: response?.Status,
          message: response?.message,
          StatusCode: response?.StatusCode
        });
        
        // Show user-friendly error message inline
        let userMessage = response?.message || 'Failed to send OTP. Please try again.';
        
        // Special handling for common error cases
        if (userMessage.includes('invalid_aadhaar') || userMessage.includes('Invalid Aadhaar')) {
          // Clear the input field and show field error for invalid Aadhaar
          setAadhaarNumber('');
          setErrors({ aadhaar: 'The Aadhaar number you entered is invalid. Please check and enter a valid 12-digit Aadhaar number.' });
          // Don't set API error for field-level errors
          return;
        } else if (userMessage.includes('already registered') || 
                   userMessage.toLowerCase().includes('aadhaar already registered')) {
          // Handle specific case: Aadhaar already registered with another account
          setAadhaarNumber(''); // Clear input field
          // Show only the API error, not both field error and API error
          setApiError(userMessage); // Show the exact API message
        } else if (userMessage.includes('vendor API') || userMessage.includes('service')) {
          setApiError('Aadhaar verification service is temporarily unavailable. Please try again after some time.');
        } else if (userMessage.includes('Verification Failed')) {
          setApiError('Aadhaar verification failed. Please check your Aadhaar number and try again.');
        } else {
          // Generic error message
          setApiError(userMessage);
        }
      }
    } catch (error) {
      console.error('Error sending Aadhaar OTP:', error);
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate directly to PIN setup with mobile number and referral code
    router.push({
      pathname: '/auth/PinSetScreen',
      params: {
        mobileNumber: params.mobileNumber,
        referralCode: params.referralCode || undefined
      }
    });
  };

  const cleanAadhaarNumber = aadhaarNumber.replace(/-/g, '');

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
            {/* <ThemedText style={styles.welcomeTitle}>Aadhaar Verification</ThemedText> */}
            <ThemedText style={styles.welcomeSubtitle}>
              Enter your Aadhaar number for secure KYC verification
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.inputGroup}>
              <ThemedView style={[
                styles.inputWrapper, 
                isAadhaarFocused && styles.inputWrapperFocused,
                errors.aadhaar && styles.inputError
              ]}>
                <ThemedView style={styles.aadhaarIconContainer}>
                  <ThemedText style={styles.aadhaarIcon}>🆔</ThemedText>
                </ThemedView>
                <TextInput
                  style={styles.aadhaarInput}
                  placeholder="XXXX-XXXX-XXXX"
                  placeholderTextColor="#9CA3AF"
                  value={aadhaarNumber}
                  onChangeText={handleAadhaarChange}
                  onFocus={() => setIsAadhaarFocused(true)}
                  onBlur={() => setIsAadhaarFocused(false)}
                  keyboardType="number-pad"
                  maxLength={14} // 12 digits + 2 hyphens
                  autoFocus={true}
                  selectionColor="#000000"
                  underlineColorAndroid="transparent"
                />
              </ThemedView>
              {errors.aadhaar && (
                <ThemedText style={styles.errorText}>{errors.aadhaar}</ThemedText>
              )}
            </ThemedView>

            {/* API Error Display */}
            {apiError && (
              <ThemedView style={styles.apiErrorContainer}>
                <ThemedText style={styles.apiErrorText}>{apiError}</ThemedText>
              </ThemedView>
            )}

            

            <TouchableOpacity 
              style={[
                styles.button, 
                (!isComplete || isLoading) && styles.buttonDisabled
              ]} 
              onPress={handleSendAadhaarOtp}
              disabled={!isComplete || isLoading}
            >
              {isLoading ? (
                <ThemedView style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.loadingSpinner} />
                  <ThemedText style={styles.buttonText}>Sending OTP...</ThemedText>
                </ThemedView>
              ) : (
                <ThemedText style={styles.buttonText}>Send OTP</ThemedText>
              )}
            </TouchableOpacity>

            <ThemedView style={styles.infoContainer}>
              <ThemedText style={styles.infoText}>
                🔒 Your Aadhaar information is encrypted and secure
              </ThemedText>
              <ThemedText style={styles.infoText}>
                ✓ We use it only for KYC verification as per RBI guidelines
              </ThemedText>
            </ThemedView>

            {/* <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
            >
              <ThemedText style={styles.skipButtonText}>Skip for now</ThemedText>
            </TouchableOpacity> */}

            <ThemedView style={styles.signupContainer}>
              <ThemedText style={styles.signupText}>
                Aadhaar verification helps us provide better services and comply with regulations
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
    lineHeight: 22,
  },

  // Form Styles
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 56,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  aadhaarIconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  aadhaarIcon: {
    fontSize: 20,
  },
  aadhaarInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'transparent',
    borderWidth: 0,
    letterSpacing: 1,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },

  // API Error Styles
  apiErrorContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  apiErrorText: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Info Section
  infoContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 8,
    lineHeight: 20,
  },

  // Buttons
  button: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  skipButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  skipButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer Section
  signupContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  signupText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
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