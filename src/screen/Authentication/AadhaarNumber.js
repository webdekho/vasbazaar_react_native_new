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
  View,
} from 'react-native';
import {
  Button,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import { sendAadhaarOTP } from '../../Services/ApiServices';
import TopAuthHeader from '../../components/TopAuthHeader';

const { width, height } = Dimensions.get('window');

/**
 * Aadhaar Number Input Screen Component
 * Handles Aadhaar number input and OTP sending for verification
 * 
 * @param {Object} route - Navigation route object containing session and permanent tokens
 * @param {Object} navigation - Navigation object for screen transitions
 * @returns {JSX.Element} Aadhaar number input screen
 */
export default function AadhaarNumberScreen({ route, navigation }) {
  // State management
  const [aadhaarParts, setAadhaarParts] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  // Route params
  const sessionToken = route.params?.sessionToken || '';
  const permanentToken = route.params?.permanentToken || '';
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Input refs for Aadhaar fields
  const inputRefs = useRef([React.createRef(), React.createRef(), React.createRef()]);

  // Log route params only on mount
  useEffect(() => {
    console.log("AadhaarNumber route params:", route.params);
  }, []);

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

  // Handle Aadhaar input changes
  const handleAadhaarChange = (index, value) => {
    // Allow only numeric input and limit to 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    
    const updatedParts = [...aadhaarParts];
    updatedParts[index] = numericValue;
    setAadhaarParts(updatedParts);

    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }

    // Auto-focus next input when current is filled
    if (numericValue.length === 4 && index < 2) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.current?.focus();
        setFocusedIndex(index + 1);
      }, 50);
    }

    // Auto-submit when all fields are filled
    const fullAadhaar = updatedParts.join('');
    if (fullAadhaar.length === 12) {
      // Small delay for better UX
      setTimeout(() => {
        handleSubmit(fullAadhaar);
      }, 300);
    }
  };

  // Handle backspace key
  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (!aadhaarParts[index] && index > 0) {
        // Move to previous input if current is empty
        setTimeout(() => {
          inputRefs.current[index - 1]?.current?.focus();
          setFocusedIndex(index - 1);
        }, 50);
      } else if (aadhaarParts[index]) {
        // Clear current input
        const updatedParts = [...aadhaarParts];
        updatedParts[index] = '';
        setAadhaarParts(updatedParts);
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

  // Validate Aadhaar number
  const validateAadhaar = (aadhaarNumber) => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      setErrorMessage('Aadhaar number must be exactly 12 digits');
      return false;
    }
    
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setErrorMessage('Aadhaar number must contain only numbers');
      return false;
    }

    // Basic Aadhaar validation (starts with non-zero digit)
    if (aadhaarNumber.startsWith('0') || aadhaarNumber.startsWith('1')) {
      setErrorMessage('Please enter a valid Aadhaar number');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = (aadhaarNumber = null) => {
    const fullAadhaar = aadhaarNumber || aadhaarParts.join('');
    
    if (!validateAadhaar(fullAadhaar)) {
      return;
    }
    
    setErrorMessage('');
    sendOTP(fullAadhaar, sessionToken);
  };

  // Send Aadhaar OTP API call
  const sendOTP = async (aadhaar_number, sessionToken) => {
    setLoading(true);
    
    try {
      const response = await sendAadhaarOTP(aadhaar_number, sessionToken);
      console.log("Aadhaar OTP API Response", response);
      
      if (response?.status === 'success') {
        navigation.navigate('aadhaar_otp_validate', {
          ref_id: response.ref_id,
          permanentToken: permanentToken,
          sessionToken: sessionToken,
          aadhaar_number: aadhaar_number
        });
      } else {
        // Handle different types of Surepass vendor API errors
        if (response?.message && response.message.includes('Failed to call vendor API: Surepass')) {
          try {
            // Extract the JSON string between the first { and last }
            const jsonStart = response.message.indexOf('{');
            const jsonEnd = response.message.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              const jsonString = response.message.substring(jsonStart, jsonEnd);
              const surepassResponse = JSON.parse(jsonString);
              const surepassMessage = surepassResponse.message;
              const surepassStatus = surepassResponse.data?.status;
              
              // Map Surepass messages to user-friendly messages
              if (surepassMessage === 'Server Error. Contact support if the error persists.') {
                setErrorMessage('Server Error. Contact support if the error persists');
              } else if (surepassMessage === 'Verification Failed.' || surepassStatus === 'invalid_aadhaar') {
                setErrorMessage('Invalid Aadhaar number. Please check and try again');
              } else {
                setErrorMessage('Aadhaar verification failed. Please try again');
              }
            } else {
              setErrorMessage('Aadhaar verification failed. Please try again');
            }
          } catch (parseError) {
            console.error('Error parsing Surepass response:', parseError);
            setErrorMessage('Aadhaar verification failed. Please try again');
          }
        } else {
          setErrorMessage(response?.message || "Failed to send OTP. Please try again.");
        }
      }
    } catch (error) {
      console.error("Aadhaar OTP Send Error", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear Aadhaar and start over
  const clearAadhaar = () => {
    setAadhaarParts(['', '', '']);
    setErrorMessage('');
    setTimeout(() => {
      inputRefs.current[0]?.current?.focus();
      setFocusedIndex(0);
    }, 50);
  };

  // Format Aadhaar for display
  const formatAadhaarForDisplay = () => {
    const fullAadhaar = aadhaarParts.join('');
    if (fullAadhaar.length >= 8) {
      return `XXXX XXXX ${fullAadhaar.slice(8)}`;
    } else if (fullAadhaar.length >= 4) {
      return `XXXX ${fullAadhaar.slice(4)}`;
    }
    return fullAadhaar;
  };

  // Check if Aadhaar is complete
  const isAadhaarComplete = aadhaarParts.every(part => part.length === 4);

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

          {/* Header Text */}
          <Text style={styles.welcomeText}>Enter Aadhaar Number</Text>
          <Text style={styles.subWelcomeText}>
            Enter your 12-digit Aadhaar number for verification
          </Text>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your Aadhaar details are encrypted and secure
            </Text>
          </View>

          {/* Aadhaar Input Fields */}
          <View style={styles.aadhaarContainer}>
            {aadhaarParts.map((part, index) => (
              <View key={index} style={styles.aadhaarInputContainer}>
                <PaperTextInput
                  ref={inputRefs.current[index]}
                  label={`XXXX`}
                  value={part}
                  onChangeText={(text) => handleAadhaarChange(index, text)}
                  onKeyPress={(event) => handleKeyPress(index, event)}
                  onFocus={() => handleFocus(index)}
                  onBlur={() => setFocusedIndex(-1)}
                  keyboardType="numeric"
                  placeholder="XXXX"
                  maxLength={4}
                  mode="outlined"
                  dense
                  style={styles.paperInput}
                  outlineStyle={[
                    styles.paperInputOutline,
                    focusedIndex === index && styles.paperInputOutlineFocused,
                    part.length === 4 && styles.paperInputOutlineFilled,
                    errorMessage && styles.paperInputOutlineError
                  ]}
                  theme={{
                    colors: {
                      primary: part.length === 4 ? '#4CAF50' : '#000000',
                      outline: errorMessage ? '#FF0000' : focusedIndex === index ? '#000000' : '#D1D5DB',
                      error: '#FF0000'
                    }
                  }}
                  returnKeyType={index === 2 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (index < 2) {
                      setTimeout(() => {
                        inputRefs.current[index + 1]?.current?.focus();
                      }, 50);
                    } else {
                      handleSubmit();
                    }
                  }}
                  right={part.length === 4 ? <PaperTextInput.Icon icon="check-circle" iconColor="#4CAF50" /> : null}
                />
              </View>
            ))}
          </View>

          {/* Aadhaar Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <Text style={styles.previewText}>
              {formatAadhaarForDisplay() || 'XXXX XXXX XXXX'}
            </Text>
          </View>

          {/* Clear Aadhaar Button */}
          {aadhaarParts.some(part => part !== '') && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAadhaar}>
              <Ionicons name="refresh-outline" size={16} color="#666666" />
              <Text style={styles.clearButtonText}>Clear and start over</Text>
            </TouchableOpacity>
          )}

          {/* Error Message */}
          {errorMessage ? (
            <Animated.View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF0000" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          ) : null}

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={() => handleSubmit()}
            disabled={loading || !isAadhaarComplete}
            loading={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonText}
            icon="arrow-right"
          >
            {loading ? 'Sending OTP...' : 'Verify Aadhaar'}
          </Button>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#666666" />
            <Text style={styles.infoText}>
              We use Aadhaar verification for enhanced security and compliance with government regulations.
            </Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact our support team
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
    paddingTop: 30,
    paddingHorizontal: 20,
    minHeight: height * 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 220,
    height: 100,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subWelcomeText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFF8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  securityText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Aadhaar Input Styles
  aadhaarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
    gap: 10,
  },
  aadhaarInputContainer: {
    flex: 1,
  },
  paperInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paperInputOutline: {
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  paperInputOutlineFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  paperInputOutlineFilled: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  paperInputOutlineError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  // Preview Section
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 10,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  // Clear Button
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666666',
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
    borderRadius: 16,
    backgroundColor: '#000000',
    marginBottom: 20,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Info Container
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
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