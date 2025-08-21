import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import SimpleCustomInput from '../../components/SimpleCustomInput';
import TopAuthHeader from '../../components/TopAuthHeader';

export default function SimpleSignIn({ navigation, route }) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'OTP sent successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to OTP screen
            navigation.navigate('otp_validate', {
              mobileNumber: mobile,
              token: 'demo-token'
            });
          }
        }
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopAuthHeader headerTitle="Sign In to VasBazaar" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
        
        <SimpleCustomInput
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          placeholder="Enter 10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>
          By continuing, you agree to our Terms & Conditions
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0f60bd',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
  },
});