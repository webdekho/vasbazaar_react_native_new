import React, { useContext, useEffect, useRef, useState } from 'react';
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
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
  Alert,
  Pressable,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  IconButton,
  Surface,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import { AuthContext } from '../../context/AuthContext';
import { pinLogin, sendPinToWhatsapp, sendOTPPin } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';

const { width, height } = Dimensions.get('window');

// Slide to Reset Component
const SlideToReset = ({ onSlideComplete, loading = false, disabled = false }) => {
  const [sliderPosition] = useState(new Animated.Value(0));
  const [sliderWidth, setSliderWidth] = useState(0);
  const [hasSlid, setHasSlid] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);
  const sliderRef = useRef(null);

  // Function to trigger reset and animate back to start
  const triggerReset = () => {
    if (hasTriggered) return; // Prevent multiple triggers
    
    console.log('SlideToReset: Triggering reset immediately!');
    setHasTriggered(true);
    
    // Trigger the reset function immediately
    onSlideComplete();
    
    // Animate back to start position
    Animated.spring(sliderPosition, {
      toValue: 0,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start(() => {
      // Reset states after animation completes
      setHasSlid(false);
      setHasTriggered(false);
      setIsDragging(false);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && !loading && sliderWidth > 0,
    onMoveShouldSetPanResponder: () => !disabled && !loading && sliderWidth > 0,
    
    onPanResponderGrant: () => {
      sliderPosition.setOffset(sliderPosition._value);
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (disabled || loading || sliderWidth === 0 || hasTriggered) return;
      
      const maxSlide = sliderWidth - 50; // Account for thumb width
      const newValue = Math.max(0, Math.min(gestureState.dx, maxSlide));
      sliderPosition.setValue(newValue);
      
      // Check if slid to completion threshold
      const completionThreshold = maxSlide * 0.85;
      if (newValue >= completionThreshold) {
        if (!hasSlid) {
          console.log('SlideToReset: Slide threshold reached');
          setHasSlid(true);
        }
        // Trigger immediately when threshold is crossed
        if (!hasTriggered) {
          triggerReset();
        }
      } else if (newValue < completionThreshold && hasSlid && !hasTriggered) {
        setHasSlid(false);
      }
    },
    
    onPanResponderRelease: (_, gestureState) => {
      if (disabled || loading || sliderWidth === 0) return;
      
      sliderPosition.flattenOffset();
      
      // If already triggered, do nothing (triggerReset handles the animation)
      if (hasTriggered) {
        return;
      }
      
      // If not triggered, snap back to start
      Animated.spring(sliderPosition, {
        toValue: 0,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }).start();
      setHasSlid(false);
    },
  });

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    console.log('SlideToReset width:', width);
    setSliderWidth(width);
  };

  // Web mouse event handlers
  const handleMouseDown = (event) => {
    if (disabled || loading || sliderWidth === 0) return;
    
    event.preventDefault();
    setIsDragging(true);
    setStartX(event.clientX);
    sliderPosition.setOffset(sliderPosition._value);
    
    console.log('Mouse down:', event.clientX);
  };

  const handleMouseMove = (event) => {
    if (!isDragging || disabled || loading || sliderWidth === 0 || hasTriggered) return;
    
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const maxSlide = sliderWidth - 50;
    const newValue = Math.max(0, Math.min(deltaX, maxSlide));
    
    sliderPosition.setValue(newValue);
    
    // Check if slid to completion threshold
    const completionThreshold = maxSlide * 0.85;
    if (newValue >= completionThreshold) {
      if (!hasSlid) {
        console.log('SlideToReset: Slide threshold reached (web)');
        setHasSlid(true);
      }
      // Trigger immediately when threshold is crossed
      if (!hasTriggered) {
        triggerReset();
      }
    } else if (newValue < completionThreshold && hasSlid && !hasTriggered) {
      setHasSlid(false);
    }
  };

  const handleMouseUp = (event) => {
    if (!isDragging || disabled || loading || sliderWidth === 0) return;
    
    event.preventDefault();
    setIsDragging(false);
    sliderPosition.flattenOffset();
    
    // If already triggered, do nothing (triggerReset handles the animation)
    if (hasTriggered) {
      return;
    }
    
    // If not triggered, snap back to start
    Animated.spring(sliderPosition, {
      toValue: 0,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
    setHasSlid(false);
  };

  // Add global mouse event listeners for web
  useEffect(() => {
    if (typeof window !== 'undefined' && isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, hasSlid, sliderWidth, hasTriggered]);

  const handleMouseLeave = () => {
    if (isDragging && !hasTriggered) {
      setIsDragging(false);
      sliderPosition.flattenOffset();
      Animated.spring(sliderPosition, {
        toValue: 0,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }).start();
      setHasSlid(false);
    }
  };

  return (
    <View style={styles.slideToResetContainer}>
      <View 
        style={[styles.sliderTrack, { width: '100%' }]}
        onLayout={handleLayout}
        ref={sliderRef}
      >
        <Text style={[
          styles.sliderText, 
          hasSlid && styles.sliderTextActive,
          (disabled || loading) && styles.sliderTextDisabled
        ]}>
          {loading 
            ? 'Sending...' 
            : hasSlid 
              ? 'Release to Reset' 
              : 'Slide to Reset PIN'
          }
        </Text>
        
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: sliderPosition }],
              opacity: disabled ? 0.5 : 1,
              cursor: typeof window !== 'undefined' ? (disabled || loading ? 'not-allowed' : 'grab') : 'default',
            }
          ]}
          {...panResponder.panHandlers}
          onMouseDown={typeof window !== 'undefined' ? handleMouseDown : undefined}
          onMouseLeave={typeof window !== 'undefined' ? handleMouseLeave : undefined}
        >
          <TouchableOpacity 
            style={styles.sliderThumbTouchArea}
            activeOpacity={0.8}
            disabled={disabled || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color="#FFFFFF" 
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// Custom PIN Input Component
const PinInput = ({ 
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
  inputRef 
}) => {
  return (
    <Pressable 
      onPress={() => inputRef?.current?.focus()}
      style={[
        styles.pinInputContainer,
        focused && styles.pinInputContainerFocused,
        filled && styles.pinInputContainerFilled,
        error && styles.pinInputContainerError,
        disabled && styles.pinInputContainerDisabled,
      ]}
    >
      <TextInput
        ref={inputRef}
        style={styles.pinInputField}
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
      />
    </Pressable>
  );
};

export default function PinValidateScreen({ route, navigation }) {
  const { secureToken, login, logout } = useContext(AuthContext);
  const theme = useTheme();
  
  // State management
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs for PIN fields
  const pinRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef()]);

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

    // Auto-focus first input with proper delay
    const timer = setTimeout(() => {
      if (pinRefs.current[0]?.current) {
        pinRefs.current[0].current.focus();
        setFocusedIndex(0);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Handle PIN input changes
  const handlePinChange = (index, value) => {
    // Filter only numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Handle multiple character input (paste scenario)
    if (numericValue.length > 1) {
      const digits = numericValue.slice(0, 4).split('');
      const newPinDigits = [...pinDigits];
      
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newPinDigits[index + i] = digit;
        }
      });
      
      setPinDigits(newPinDigits);
      
      // Focus on the next empty field or last field
      const nextIndex = Math.min(index + digits.length, 3);
      setTimeout(() => {
        if (pinRefs.current[nextIndex]?.current) {
          pinRefs.current[nextIndex].current.focus();
          setFocusedIndex(nextIndex);
        }
      }, 50);
      
      // Auto-submit if PIN is complete
      if (newPinDigits.every(digit => digit !== '')) {
        setTimeout(() => {
          handleSubmitWithPin(newPinDigits.join(''));
        }, 300);
      }
      
      return;
    }
    
    // Handle single character input
    const newPinDigits = [...pinDigits];
    newPinDigits[index] = numericValue;
    setPinDigits(newPinDigits);

    // Clear messages when user starts typing
    if (errorMessage || successMessage) {
      setErrorMessage('');
      setSuccessMessage('');
    }

    // Auto-focus next input when digit is entered
    if (numericValue && index < 3) {
      setTimeout(() => {
        if (pinRefs.current[index + 1]?.current) {
          pinRefs.current[index + 1].current.focus();
          setFocusedIndex(index + 1);
        }
      }, 50);
    } else if (numericValue && index === 3) {
      // Auto-submit when PIN is complete
      const completePinValue = newPinDigits.join('');
      if (completePinValue.length === 4) {
        setTimeout(() => {
          handleSubmitWithPin(completePinValue);
        }, 300);
      }
    }
  };

  // Handle backspace key
  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace') {
      const newPinDigits = [...pinDigits];
      
      if (newPinDigits[index]) {
        // Clear current input
        newPinDigits[index] = '';
        setPinDigits(newPinDigits);
      } else if (index > 0) {
        // Move to previous input and clear it
        newPinDigits[index - 1] = '';
        setPinDigits(newPinDigits);
        
        setTimeout(() => {
          if (pinRefs.current[index - 1]?.current) {
            pinRefs.current[index - 1].current.focus();
            setFocusedIndex(index - 1);
          }
        }, 50);
      }
    }
  };

  // Handle input focus
  const handleFocus = (index) => {
    setFocusedIndex(index);
    if (errorMessage || successMessage) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setTimeout(() => {
      setFocusedIndex(-1);
    }, 100);
  };

  // Handle submit editing
  const handleSubmitEditing = (index) => {
    if (index < 3) {
      if (pinRefs.current[index + 1]?.current) {
        pinRefs.current[index + 1].current.focus();
        setFocusedIndex(index + 1);
      }
    } else {
      // Last field - submit the form
      handleSubmit();
    }
  };

  // Shake animation for wrong PIN
  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Validate PIN
  const validatePin = (pin) => {
    if (!pin || pin.length < 4) {
      setErrorMessage('Please enter all 4 digits');
      return false;
    }
    
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN must contain only numbers');
      return false;
    }
    
    return true;
  };

  // Handle form submission with explicit PIN value
  const handleSubmitWithPin = async (pin) => {
    if (!validatePin(pin)) {
      triggerShakeAnimation();
      return;
    }

    if (isLocked) {
      setErrorMessage('Too many failed attempts. Please reset your PIN.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await pinLogin(pin, secureToken);
      console.log("PIN Login Response:", response);
      
      if (response?.status === 'success') {
        setSuccessMessage('PIN verified successfully!');
        setAttempts(0);
        setTimeout(() => {
          login(response.data.token, null, secureToken);
        }, 1000);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setErrorMessage('Too many failed attempts. Please reset your PIN to continue.');
        } else {
          setErrorMessage(response?.message || `Invalid PIN. ${3 - newAttempts} attempts remaining.`);
        }
        
        triggerShakeAnimation();
        clearPinInputs();
      }
    } catch (error) {
      console.error("PIN validation error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
      triggerShakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission using current state
  const handleSubmit = async () => {
    const pin = pinDigits.join('');
    await handleSubmitWithPin(pin);
  };

  // Clear PIN inputs
  const clearPinInputs = () => {
    setPinDigits(['', '', '', '']);
    setFocusedIndex(-1);
    setTimeout(() => {
      if (pinRefs.current[0]?.current) {
        pinRefs.current[0].current.focus();
        setFocusedIndex(0);
      }
    }, 150);
  };

  // Handle PIN reset
  const handleResetPin = async () => {
    setResetLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await sendOTPPin(secureToken);
      console.log("Reset PIN Response:", response);
      
      if (response?.status === 'success') {
        // setSuccessMessage('✅ New PIN has been sent to your mobile number via WhatsApp.');
        // setAttempts(0);
        // setIsLocked(false);
        // clearPinInputs();
        
        // Show success alert
        navigation.navigate('otpPinValidate',{response:response.data});


      } else {
        setErrorMessage('❌ ' + (response?.message || 'Failed to reset PIN. Please try again.'));
        
        // Show error alert
        Alert.alert(
          'PIN Reset Failed',
          response?.message || 'Unable to reset PIN. Please try again later.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error("Reset PIN error:", error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setErrorMessage('❌ ' + errorMsg);
      
      // Show network error alert
      Alert.alert(
        'Network Error',
        errorMsg,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Toggle PIN visibility
  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setErrorMessage('Failed to logout. Please try again.');
    }
  };

  // Check if PIN is complete
  const isPinComplete = pinDigits.every(digit => digit !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        nestedScrollEnabled={true}
        style={styles.scrollView}
        alwaysBounceVertical={false}
      >
        {/* Top Auth Header */}
        <TopAuthHeader
          headerText="Enter Your PIN"
          headerTitle="Login with your 4-digit PIN"
        />

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="text"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonText}
            compact
          >
            Switch Account
          </Button>
        </View>

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
          {/* Header Text */}
          <Text style={styles.title}>Verify your Login Pin</Text>
          <Text style={styles.subtitle}>Confirm your 4-digit PIN</Text>

          {/* PIN Section */}
          <Animated.View 
            style={[
              styles.pinContainer,
              { transform: [{ translateX: shakeAnim }] }
            ]}
          >
            {pinDigits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.pinInputWrapper,
                  focusedIndex === index && styles.pinInputWrapperFocused,
                  digit && styles.pinInputWrapperFilled,
                  errorMessage && styles.pinInputWrapperError,
                  isLocked && styles.pinInputWrapperLocked,
                ]}
              >
                <TextInput
                  ref={pinRefs.current[index]}
                  style={styles.pinInput}
                  value={digit}
                  onChangeText={(value) => handlePinChange(index, value)}
                  onKeyPress={(event) => handleKeyPress(index, event)}
                  onFocus={() => handleFocus(index)}
                  onBlur={handleBlur}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={!showPin}
                  editable={!loading && !isLocked}
                  returnKeyType={index === 3 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (index < 3) {
                      setTimeout(() => {
                        if (pinRefs.current[index + 1]?.current) {
                          pinRefs.current[index + 1].current.focus();
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

          {/* Error/Success Message */}
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          </View>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={loading || !isPinComplete || isLocked}
              loading={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonText}
            >
              {loading ? 'Verifying...' : 'Verify now'}
            </Button>
          </View>

          {/* Reset PIN Section */}
          <View style={styles.resetPinContainer}>
            <SlideToReset 
              onSlideComplete={handleResetPin}
              loading={resetLoading}
              disabled={resetLoading}
            />
            
            <Text style={styles.resetPinInfo}>
              Forgot your PIN? New PIN will be sent to your WhatsApp
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
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 50,
  },
  
  // PIN Container
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  
  // PIN Input Components
  pinInputWrapper: {
    width: 55,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInputWrapperFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  pinInputWrapperFilled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  pinInputWrapperError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFFFFF',
  },
  pinInputWrapperLocked: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  pinInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
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
  
  // Error Message
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
  },
  
  // Success Message
  successText: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  
  // Submit Button Container
  submitButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  submitButton: {
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Logout Button
  logoutContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  logoutButton: {
    borderRadius: 20,
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  
  // Reset PIN Slider Styles
  resetPinContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  resetPinSlider: {
    width: '100%',
    marginBottom: 15,
  },
  sliderTrack: {
    position: 'relative',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    ...Platform.select({
      web: {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      },
    }),
  },
  sliderThumb: {
    position: 'absolute',
    left: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...Platform.select({
      web: {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      },
    }),
  },
  sliderThumbTouchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sliderText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  sliderTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  resetPinInfo: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 10,
  },
  slideToResetContainer: {
    width: '100%',
    marginBottom: 15,
  },
  sliderTextDisabled: {
    color: '#999999',
    opacity: 0.6,
  },
  
  // PinInput component styles
  pinInputContainer: {
    width: 55,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInputContainerFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  pinInputContainerFilled: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  pinInputContainerError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFFFFF',
  },
  pinInputContainerDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  pinInputField: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
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
});