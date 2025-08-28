import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, View , Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authenticateWithPin } from '../../services';
import { saveSessionToken } from '../../services/auth/sessionManager';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PinValidateScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [permanentToken, setPermanentToken] = useState(null);

  // Get permanent token on component mount
  useEffect(() => {
    const getPermanentToken = async () => {
      try {
        const token = await AsyncStorage.getItem('permanentToken');
        if (token) {
          setPermanentToken(token);
        } else {
          // No permanent token, redirect to login
          router.replace('/auth/LoginScreen');
        }
      } catch (error) {
        console.error('Error getting permanent token:', error);
        router.replace('/auth/LoginScreen');
      }
    };

    getPermanentToken();
  }, []);

  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Auto-validate when 4 digits entered
      if (newPin.length === 4) {
        handlePinValidation(newPin);
      }
    }
    setError('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handlePinValidation = async (pinToValidate = pin) => {
    if (pinToValidate.length !== 4 || !permanentToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await authenticateWithPin(pinToValidate, permanentToken);
      
      if (response?.status === 'success') {
        const data = response.data;
        const sessionToken = data.token;

        // Prepare user data matching the OtpScreen pattern
        const userData = {
          refferalCode: data.referralCode || data.refferalCode,
          verified_status: data.verified_status,
          name: data.name,
          mobile: data.mobile,
          city: data.city,
          state: data.state,
          userType: data.userType,
          pin: data.pin
        };

        // Save profile photo if provided
        if (data.profile) {
          await AsyncStorage.setItem("profile_photo", data.profile);
        }

        // Save session token with auto-expiration
        await saveSessionToken(sessionToken);
        
        // Update user data in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Set flag to bypass AuthGuard temporarily
        await AsyncStorage.setItem('pinValidationSuccess', 'true');
        
        // Use setTimeout to ensure all async operations complete
        setTimeout(async () => {
          // Refresh auth state first
          await refreshAuth();
          
          // Clear the bypass flag after a delay
          setTimeout(() => {
            AsyncStorage.removeItem('pinValidationSuccess');
          }, 1000);
          
          // Navigate to home
          router.replace('/(tabs)/home');
          
        }, 200);
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!permanentToken) {
      setError('Invalid session. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://apis.vasbazaar.com/login/sendOTPToken', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: permanentToken,
          requestType: "customer_approval"
        })
      });

      const result = await response.json();
      console.log('Forgot PIN API Response:', result);
      console.log('Response status:', response.status);
      console.log('Result Status:', result?.Status);
      console.log('Result data:', result?.data);

      if (result?.Status === 'SUCCESS' || result?.status === 'success' || (response.ok && result?.StatusCode === 200)) {
        console.log('Redirecting to PinOtpScreen with tempToken:', result.data);
        // Navigate to PinOtpScreen with necessary parameters
        router.push({
          pathname: '/auth/PinOtpScreen',
          params: {
            permanentToken: permanentToken,
            tempToken: result.data, // The token is directly in the data field
          }
        });
      } else {
        console.log('Not redirecting, condition not met');
        setError(result?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Forgot PIN OTP Error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = async () => {
    try {
      // Delete permanentToken from AsyncStorage
      await AsyncStorage.removeItem('permanentToken');
      console.log('Permanent token deleted');
      
      // Navigate to LoginScreen
      router.replace('/auth/LoginScreen');
    } catch (error) {
      console.error('Error deleting permanent token:', error);
      // Navigate anyway
      router.replace('/auth/LoginScreen');
    }
  };

  const renderPinDisplay = () => {
    return (
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'back']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.numberButton,
                  item === '' && styles.numberButtonEmpty
                ]}
                onPress={() => {
                  if (item === 'back') {
                    handleBackspace();
                  } else if (item !== '') {
                    handleNumberPress(item);
                  }
                }}
                disabled={item === '' || loading}
              >
                {item === 'back' ? (
                  <ThemedText style={[
                    styles.backButtonText,
                  ]}>⌫</ThemedText>
                ) : (
                  <ThemedText style={[
                    styles.numberButtonText,
                  ]}>{item}</ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>Enter Your PIN</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your 4-digit PIN to access your account
            </ThemedText>
          </ThemedView>

          {renderPinDisplay()}

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          {loading && (
            <ThemedText style={styles.loadingText}>Validating...</ThemedText>
          )}

          {renderNumberPad()}

          <TouchableOpacity style={styles.forgotPinButton} onPress={handleForgotPin} disabled={loading}>
            <ThemedText style={styles.forgotPinText}>Forgot PIN?</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginRedirectButton} onPress={handleLoginRedirect}>
            <ThemedText style={styles.loginRedirectText}>Switch Account</ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.infoText}>
              Keep your PIN secure and don't share it with anyone
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  numberPad: {
    marginBottom: 30,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 30,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonEmpty: {
    backgroundColor: 'transparent',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  forgotPinButton: {
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  forgotPinText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRedirectButton: {
    alignItems: 'center',
    padding: 15,
    marginBottom: 20,
  },
  loginRedirectText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});