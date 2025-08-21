import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { set4digitPin } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';
import CrashReportingService from '../../Services/CrashReportingService';

const { width, height } = Dimensions.get('window');

// Modern PIN Input Component
const ModernPinInput = ({ 
  value, 
  onChangeText, 
  onKeyPress, 
  onFocus, 
  onBlur, 
  index, 
  focused, 
  filled, 
  error, 
  disabled, 
  showPin,
  onSubmitEditing,
  inputRef,
  autoFocus = false
}) => {
  return (
    <Pressable 
      onPress={() => inputRef?.current?.focus()}
      style={[
        styles.modernPinInputContainer,
        focused && styles.modernPinInputFocused,
        filled && styles.modernPinInputFilled,
        error && styles.modernPinInputError,
        disabled && styles.modernPinInputDisabled,
      ]}
    >
      <TextInput
        ref={inputRef}
        style={styles.modernPinInput}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType="number-pad"
        maxLength={1}
        secureTextEntry={!showPin}
        editable={!disabled}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        returnKeyType={index === 3 ? 'done' : 'next'}
        onSubmitEditing={onSubmitEditing}
        textAlign="center"
        selectTextOnFocus={true}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        contextMenuHidden={true}
        caretHidden={Platform.OS === 'ios'}
        autoFocus={autoFocus}
        blurOnSubmit={false}
      />
      {filled && !showPin && (
        <View style={styles.pinDot} />
      )}
    </Pressable>
  );
};

export default function PinGenerateScreen({ route, navigation }) {
  const { permanentToken, sessionToken } = route.params || {};
  const authContext = useContext(AuthContext);
  const { login } = authContext;
  
  // State management
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('new');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showPin, setShowPin] = useState({ new: false, confirm: false });
  const [currentStep, setCurrentStep] = useState(1); // 1: New PIN, 2: Confirm PIN
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs for PIN fields
  const newPinRefs = useRef([
    React.createRef(), 
    React.createRef(), 
    React.createRef(), 
    React.createRef()
  ]);
  const confirmPinRefs = useRef([
    React.createRef(), 
    React.createRef(), 
    React.createRef(), 
    React.createRef()
  ]);

  // Component mount animation
  useEffect(() => {
    try {
      CrashReportingService.logEvent('pin_generate_screen_mounted', {
        hasSessionToken: !!sessionToken,
        hasPermanentToken: !!permanentToken
      });
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-focus first input with shorter delay for better UX
      const timer = setTimeout(() => {
        newPinRefs.current[0]?.current?.focus();
        setFocusedIndex(0);
        setFocusedField('new');
      }, 200);

      return () => clearTimeout(timer);
    } catch (error) {
      CrashReportingService.logError(error, {
        context: 'pin_generate_screen_mount'
      });
    }
  }, []);

  // Shake animation for errors
  const triggerShakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Handle PIN input changes with optimized logic
  const handlePinChange = useCallback((index, value, pinType) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 1);
    
    const currentPin = pinType === 'new' ? newPin : confirmPin;
    const setPin = pinType === 'new' ? setNewPin : setConfirmPin;
    const refs = pinType === 'new' ? newPinRefs : confirmPinRefs;
    
    // Update the PIN array
    const updated = [...currentPin];
    updated[index] = numericValue;
    setPin(updated);

    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }

    // Auto-focus logic with improved performance
    if (numericValue && index < 3) {
      // Move to next field in same PIN section
      setTimeout(() => {
        refs.current[index + 1]?.current?.focus();
        setFocusedIndex(index + 1);
      }, 50);
    } else if (numericValue && index === 3) {
      // Last digit entered
      const isComplete = updated.every(digit => digit !== '');
      
      if (pinType === 'new' && isComplete) {
        // Move to confirm PIN section
        setCurrentStep(2);
        setTimeout(() => {
          confirmPinRefs.current[0]?.current?.focus();
          setFocusedField('confirm');
          setFocusedIndex(0);
        }, 100);
      } else if (pinType === 'confirm' && isComplete) {
        // Don't auto-submit, wait for user to manually submit or press button
        // This prevents the early submission issue
        setTimeout(() => {
          refs.current[index]?.current?.blur();
          setFocusedIndex(-1);
        }, 100);
      }
    }
  }, [newPin, confirmPin, errorMessage]);

  // Handle backspace with improved logic
  const handleKeyPress = useCallback((index, event, pinType) => {
    if (event.nativeEvent.key === 'Backspace') {
      const currentPin = pinType === 'new' ? newPin : confirmPin;
      const setPin = pinType === 'new' ? setNewPin : setConfirmPin;
      const refs = pinType === 'new' ? newPinRefs : confirmPinRefs;
      
      const updated = [...currentPin];
      
      if (updated[index]) {
        // Clear current input
        updated[index] = '';
        setPin(updated);
      } else if (index > 0) {
        // Move to previous input and clear it
        updated[index - 1] = '';
        setPin(updated);
        
        setTimeout(() => {
          refs.current[index - 1]?.current?.focus();
          setFocusedIndex(index - 1);
        }, 50);
      }
    }
  }, [newPin, confirmPin]);

  // Handle input focus with performance optimization
  const handleFocus = useCallback((fieldType, index) => {
    setFocusedField(fieldType);
    setFocusedIndex(index);
    
    // Clear errors when user focuses
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [errorMessage]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setFocusedIndex(-1);
    }, 100);
  }, []);

  // Handle submit editing for smoother navigation
  const handleSubmitEditing = useCallback((index, pinType) => {
    const refs = pinType === 'new' ? newPinRefs : confirmPinRefs;
    
    if (index < 3) {
      setTimeout(() => {
        refs.current[index + 1]?.current?.focus();
        setFocusedIndex(index + 1);
      }, 50);
    } else if (pinType === 'new') {
      // Move to confirm PIN
      setCurrentStep(2);
      setTimeout(() => {
        confirmPinRefs.current[0]?.current?.focus();
        setFocusedField('confirm');
        setFocusedIndex(0);
      }, 100);
    } else {
      // Last field of confirm PIN - blur and let user manually submit
      refs.current[index]?.current?.blur();
      setFocusedIndex(-1);
    }
  }, []);

  // Validate PIN with comprehensive checks
  const validatePin = useCallback(() => {
    const pin1 = newPin.join('');
    const pin2 = confirmPin.join('');

    // Clear any existing error first
    setErrorMessage('');

    if (!pin1 || pin1.length < 4) {
      setErrorMessage('Please enter a complete 4-digit PIN');
      triggerShakeAnimation();
      return false;
    }

    if (!pin2 || pin2.length < 4) {
      setErrorMessage('Please confirm your 4-digit PIN');
      triggerShakeAnimation();
      return false;
    }

    if (pin1 !== pin2) {
      setErrorMessage('PINs do not match. Please try again');
      triggerShakeAnimation();
      return false;
    }

    // Check for weak PINs
    const weakPins = ['0000', '1234', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0123', '9876'];
    if (weakPins.includes(pin1)) {
      setErrorMessage('Please choose a more secure PIN');
      triggerShakeAnimation();
      return false;
    }

    return true;
  }, [newPin, confirmPin, triggerShakeAnimation]);

  // Handle form submission with improved logic
  const handleSubmit = useCallback(async () => {
    // Prevent multiple submissions
    if (loading || hasSubmitted) return;

    try {
      CrashReportingService.logEvent('pin_submit_attempt', {
        newPinLength: newPin.join('').length,
        confirmPinLength: confirmPin.join('').length,
        pinsMatch: newPin.join('') === confirmPin.join('')
      });
      
      if (!validatePin()) {
        return;
      }
      
      const pin = newPin.join('');
      setHasSubmitted(true);
      await setVerifiedPin(pin);
    } catch (error) {
      CrashReportingService.logError(error, {
        context: 'handleSubmit'
      });
      setErrorMessage('An unexpected error occurred. Please try again.');
      triggerShakeAnimation();
    } finally {
      setHasSubmitted(false);
    }
  }, [newPin, confirmPin, loading, hasSubmitted, validatePin, triggerShakeAnimation]);

  // Set PIN API call with improved error handling
  const setVerifiedPin = useCallback(async (pin) => {
    setLoading(true);
    
    try {
      CrashReportingService.logEvent('pin_creation_attempt', {
        hasSessionToken: !!sessionToken,
        hasPermanentToken: !!permanentToken
      });
      
      const response = await set4digitPin(pin, sessionToken);
      console.log("Set PIN Response", response);
      
      if (response?.status === 'success') {
        CrashReportingService.logEvent('pin_creation_success');
        // Add a small delay for better UX
        setTimeout(() => {
          login(sessionToken, null, permanentToken);
        }, 500);
      } else {
        const errorMsg = response?.message || "Failed to create PIN. Please try again.";
        CrashReportingService.logError(new Error(`PIN creation failed: ${errorMsg}`), {
          context: 'setVerifiedPin',
          response: response
        });
        setErrorMessage(errorMsg);
        triggerShakeAnimation();
      }
    } catch (error) {
      console.error("PIN Creation Error", error);
      CrashReportingService.logError(error, {
        context: 'setVerifiedPin_network_error',
        hasSessionToken: !!sessionToken
      });
      setErrorMessage("Network error. Please check your connection and try again.");
      triggerShakeAnimation();
    } finally {
      setLoading(false);
    }
  }, [sessionToken, permanentToken, login, triggerShakeAnimation]);

  // Clear PIN and start over
  const clearPins = useCallback(() => {
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setErrorMessage('');
    setCurrentStep(1);
    setFocusedField('new');
    setFocusedIndex(0);
    setHasSubmitted(false);
    
    setTimeout(() => {
      newPinRefs.current[0]?.current?.focus();
    }, 100);
  }, []);

  // Toggle PIN visibility
  const togglePinVisibility = useCallback((field) => {
    setShowPin(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // Computed values
  const isNewPinComplete = newPin.every(digit => digit !== '');
  const isConfirmPinComplete = confirmPin.every(digit => digit !== '');
  const isBothPinsComplete = isNewPinComplete && isConfirmPinComplete;
  const pinsMatch = newPin.join('') === confirmPin.join('') && isBothPinsComplete;
  const canSubmit = isBothPinsComplete && pinsMatch && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        style={styles.scrollView}
      >
        {/* Top Auth Header */}
        <TopAuthHeader
          headerText="Set Your Login PIN"
          headerTitle="Create a secure 4-digit PIN"
        />

        {/* Form Section */}
        <Animated.View
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateX: shakeAnim }]
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

          {/* Header Text */}
          <Text style={styles.welcomeText}>Create Your PIN</Text>
          <Text style={styles.subWelcomeText}>
            Set a secure 4-digit PIN for quick and safe access to your account
          </Text>

          {/* Modern Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.stepIndicator, currentStep >= 1 && styles.stepIndicatorActive]}>
                {currentStep > 1 ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>1</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Create PIN</Text>
            </View>
            <View style={[styles.progressLine, currentStep > 1 && styles.progressLineActive]} />
            <View style={styles.progressStep}>
              <View style={[styles.stepIndicator, currentStep >= 2 && styles.stepIndicatorActive]}>
                <Text style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Confirm PIN</Text>
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
            <Text style={styles.securityText}>
              Choose a unique PIN that only you know
            </Text>
          </View>

          {/* New PIN Section */}
          <View style={[styles.pinSection, currentStep > 1 && styles.pinSectionCompleted]}>
            <View style={styles.pinHeader}>
              <Text style={styles.pinLabel}>Enter New PIN</Text>
              <TouchableOpacity 
                onPress={() => togglePinVisibility('new')}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={showPin.new ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pinInputContainer}>
              {newPin.map((digit, index) => (
                <ModernPinInput
                  key={index}
                  value={digit}
                  onChangeText={(value) => handlePinChange(index, value, 'new')}
                  onKeyPress={(event) => handleKeyPress(index, event, 'new')}
                  onFocus={() => handleFocus('new', index)}
                  onBlur={handleBlur}
                  onSubmitEditing={() => handleSubmitEditing(index, 'new')}
                  index={index}
                  focused={focusedField === 'new' && focusedIndex === index}
                  filled={!!digit}
                  error={!!errorMessage}
                  disabled={loading}
                  showPin={showPin.new}
                  inputRef={newPinRefs.current[index]}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {isNewPinComplete && (
              <View style={styles.successIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.successText}>PIN created successfully!</Text>
              </View>
            )}
          </View>

          {/* Confirm PIN Section */}
          {currentStep >= 2 && (
            <View style={styles.pinSection}>
              <View style={styles.pinHeader}>
                <Text style={styles.pinLabel}>Confirm Your PIN</Text>
                <TouchableOpacity 
                  onPress={() => togglePinVisibility('confirm')}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={showPin.confirm ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666666" 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pinInputContainer}>
                {confirmPin.map((digit, index) => (
                  <ModernPinInput
                    key={index}
                    value={digit}
                    onChangeText={(value) => handlePinChange(index, value, 'confirm')}
                    onKeyPress={(event) => handleKeyPress(index, event, 'confirm')}
                    onFocus={() => handleFocus('confirm', index)}
                    onBlur={handleBlur}
                    onSubmitEditing={() => handleSubmitEditing(index, 'confirm')}
                    index={index}
                    focused={focusedField === 'confirm' && focusedIndex === index}
                    filled={!!digit}
                    error={!!errorMessage}
                    disabled={loading}
                    showPin={showPin.confirm}
                    inputRef={confirmPinRefs.current[index]}
                  />
                ))}
              </View>

              {/* PIN Match Indicator */}
              {isConfirmPinComplete && (
                <View style={[styles.matchIndicator, !pinsMatch && styles.errorIndicator]}>
                  <Ionicons 
                    name={pinsMatch ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={pinsMatch ? "#4CAF50" : "#FF5252"} 
                  />
                  <Text style={[styles.matchText, !pinsMatch && styles.errorText]}>
                    {pinsMatch ? 'PINs match perfectly!' : 'PINs do not match'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Clear PIN Button */}
          {(isNewPinComplete || isConfirmPinComplete) && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearPins}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={16} color="#666666" />
              <Text style={styles.clearButtonText}>Clear and start over</Text>
            </TouchableOpacity>
          )}

          {/* Error Message - Only one at a time */}
          {errorMessage ? (
            <Animated.View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#FF5252" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              canSubmit && styles.submitButtonEnabled,
              loading && styles.submitButtonLoading
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Creating PIN...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.submitButtonText}>Create PIN</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>
              You'll use this PIN to quickly access your account. Keep it secure and don't share it with anyone.
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Form Section
  formSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: height * 0.03,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    minHeight: height * 0.65,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  logo: {
    width: Math.min(width * 0.4, 160),
    height: Math.min(height * 0.08, 60),
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subWelcomeText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  
  // Modern Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  stepIndicatorActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  progressLineActive: {
    backgroundColor: '#000000',
  },
  
  // Security Tips
  securityTips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityText: {
    fontSize: 13,
    color: '#16A34A',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // PIN Section
  pinSection: {
    marginBottom: 24,
  },
  pinSectionCompleted: {
    opacity: 0.7,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 4,
  },
  
  // Modern PIN Input Container
  pinInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  
  // Modern PIN Input Components
  modernPinInputContainer: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modernPinInputFocused: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernPinInputFilled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  modernPinInputError: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  modernPinInputDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  modernPinInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
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
  pinDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  
  // Success Indicator
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    fontSize: 13,
    color: '#16A34A',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Match Indicator
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  matchText: {
    fontSize: 13,
    color: '#16A34A',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Error Indicator
  errorIndicator: {
    backgroundColor: '#FEF2F2',
  },
  
  // Clear Button
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: '#E5E5E5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  submitButtonEnabled: {
    backgroundColor: '#000000',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonLoading: {
    backgroundColor: '#666666',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Info Container
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});