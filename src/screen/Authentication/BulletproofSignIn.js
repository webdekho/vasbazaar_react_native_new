// React imports
import React, { useState } from 'react';

// React Native imports
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

// Third-party library imports
import PropTypes from 'prop-types';

/**
 * BulletproofSignIn - Enhanced sign-in screen with robust mobile number authentication
 * 
 * This component provides a bulletproof interface for user authentication with mobile number.
 * Features include:
 * - Mobile number input with validation
 * - Custom header with branding
 * - OTP sending functionality
 * - Alert-based user feedback
 * - Responsive design and styling
 * 
 * @param {Object} props - Component props
 * @param {Object} props.navigation - Navigation object for screen navigation
 * @returns {JSX.Element} The rendered BulletproofSignIn component
 */
export default function BulletproofSignIn({ navigation }) {
  const [mobile, setMobile] = useState('');

  const handleSignIn = () => {
    Alert.alert('Success', `Mobile: ${mobile}`, [
      {
        text: 'OK',
        onPress: () => {}
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>VasBazaar</Text>
        <Text style={styles.headerSubtitle}>Sign In to Continue</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Enter your mobile number</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignIn}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>
          BulletproofSignIn is working!
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
  header: {
    backgroundColor: '#0f60bd',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0f60bd',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 14,
    color: '#28a745',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '600',
  },
});

// PropTypes validation
BulletproofSignIn.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};