import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { setUserPin } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';

export default function PinSetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshAuth } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('set'); // 'set' or 'confirm'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumberPress = (number) => {
    if (loading) return; // Prevent input during loading
    
    if (step === 'set') {
      if (pin.length < 4) {
        setPin(prev => prev + number);
      }
    } else {
      if (confirmPin.length < 4) {
        setConfirmPin(prev => prev + number);
      }
    }
    setError('');
  };

  const handleBackspace = () => {
    if (loading) return; // Prevent input during loading
    
    if (step === 'set') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
    setError('');
  };

  const handleNext = async () => {
    if (step === 'set' && pin.length === 4) {
      setStep('confirm');
    } else if (step === 'confirm' && confirmPin.length === 4) {
      if (pin === confirmPin) {
        await handleSetPin();
      } else {
        setError('PINs do not match. Please try again.');
        setConfirmPin('');
      }
    }
  };

  const handleSetPin = async () => {
    if (!params.sessionToken) {
      setError('Session expired. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Setting PIN with sessionToken:', params.sessionToken?.substring(0, 20) + '...');
      
      const response = await setUserPin(pin, params.sessionToken);
      
      console.log('Set PIN API Response:', response);
      
      if (response?.status === 'success') {
        console.log('PIN set successfully, redirecting to home');
        
        // Set flag to bypass AuthGuard temporarily
        await AsyncStorage.setItem('pinSetSuccess', 'true');
        
        // Use setTimeout to ensure all async operations complete
        setTimeout(async () => {
          try {
            // Refresh auth state first
            console.log('PIN Set - Calling refreshAuth');
            await refreshAuth();
            console.log('PIN Set - Auth refreshed, navigating to home');
            
            // Clear the bypass flag after a delay
            setTimeout(() => {
              AsyncStorage.removeItem('pinSetSuccess');
            }, 1000);
            
            // Navigate to home
            router.replace('/(tabs)/home');
          } catch (error) {
            console.error('PIN Set - Error during refresh/navigation:', error);
          }
        }, 500);
      } else {
        setError(response?.message || 'Failed to set PIN. Please try again.');
      }
    } catch (error) {
      console.error('Set PIN Error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('set');
      setConfirmPin('');
      setError('');
    }
  };

  const renderPinDisplay = () => {
    const currentPin = step === 'set' ? pin : confirmPin;
    return (
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentPin.length && styles.pinDotFilled
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
                  item === '' && styles.numberButtonEmpty,
                  loading && styles.numberButtonDisabled
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
            <ThemedText type="title" style={styles.title}>
              {step === 'set' ? 'Set Your PIN' : 'Confirm Your PIN'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {step === 'set' 
                ? 'Create a 4-digit PIN for secure access' 
                : 'Re-enter your PIN to confirm'
              }
            </ThemedText>
          </ThemedView>

          {renderPinDisplay()}

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          {loading && (
            <ThemedText style={styles.loadingText}>Setting up your PIN...</ThemedText>
          )}

          {renderNumberPad()}

          <ThemedView style={styles.buttonContainer}>
            {step === 'confirm' && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ThemedText style={styles.backButtonTextSmall}>Back</ThemedText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.nextButton,
                (((step === 'set' && pin.length !== 4) || 
                 (step === 'confirm' && confirmPin.length !== 4)) || loading) && 
                styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={
                loading ||
                (step === 'set' && pin.length !== 4) || 
                (step === 'confirm' && confirmPin.length !== 4)
              }
            >
              <ThemedText style={styles.nextButtonText}>
                {loading ? 'Setting PIN...' : 
                 step === 'set' ? 'Continue' : 'Complete Setup'}
              </ThemedText>
            </TouchableOpacity>
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
  numberButtonDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 15,
  },
  backButtonTextSmall: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});