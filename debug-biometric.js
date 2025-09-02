// Biometric Debug Helper - Add this to test the flow

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getUserIdentifier, 
  getBiometricPreference,
  isBiometricSetupCompleted,
  getSecurePin,
  setBiometricPreference,
  setBiometricSetupCompleted,
  storeSecurePin
} from './utils/secureStorage';
import { 
  isBiometricAuthAvailable,
  checkBiometricSupport,
  biometricLogin
} from './services/auth/biometricService';

export const debugBiometricFlow = async () => {
  console.log('🔍 === BIOMETRIC DEBUG START ===');
  
  try {
    // 1. Check basic app state
    console.log('📱 1. Checking App State...');
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    const userData = await AsyncStorage.getItem('userData');
    const aadhaarData = await AsyncStorage.getItem('aadhaarData');
    
    console.log('- permanentToken exists:', !!permanentToken);
    console.log('- userData exists:', !!userData);
    console.log('- aadhaarData exists:', !!aadhaarData);
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('- userData mobile:', user.mobile);
      console.log('- userData name:', user.name);
    }
    
    // 2. Check user identifier
    console.log('🆔 2. Checking User Identifier...');
    const userId = await getUserIdentifier();
    console.log('- userId:', userId);
    
    if (!userId) {
      console.log('❌ PROBLEM: No user identifier found');
      return;
    }
    
    // 3. Check device biometric support
    console.log('📱 3. Checking Device Support...');
    const deviceSupport = await checkBiometricSupport();
    console.log('- hasHardware:', deviceSupport.hasHardware);
    console.log('- isEnrolled:', deviceSupport.isEnrolled);
    console.log('- isAvailable:', deviceSupport.isAvailable);
    console.log('- authTypes:', deviceSupport.authTypes);
    
    // 4. Check user preferences
    console.log('👤 4. Checking User Preferences...');
    const biometricEnabled = await getBiometricPreference(userId);
    const setupCompleted = await isBiometricSetupCompleted(userId);
    const storedPin = await getSecurePin(userId);
    
    console.log('- biometricEnabled:', biometricEnabled);
    console.log('- setupCompleted:', setupCompleted);
    console.log('- storedPin exists:', !!storedPin);
    console.log('- storedPin value:', storedPin ? `${storedPin.length} digits` : 'none');
    
    // 5. Check overall availability
    console.log('✅ 5. Checking Overall Availability...');
    const availability = await isBiometricAuthAvailable();
    console.log('- available:', availability.available);
    console.log('- canSetup:', availability.canSetup);
    console.log('- reason:', availability.reason);
    
    // 6. If everything looks good, test login
    if (availability.available) {
      console.log('🔐 6. Testing Biometric Login...');
      console.log('⚠️ This will prompt for biometric authentication!');
      // Uncomment to test actual login:
      // const loginResult = await biometricLogin();
      // console.log('- loginResult:', loginResult);
    }
    
    console.log('🔍 === BIOMETRIC DEBUG END ===');
    
  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
};

// Manual setup test
export const testManualSetup = async (testPin = "1234") => {
  console.log('🛠️ === MANUAL SETUP TEST START ===');
  
  try {
    const userId = await getUserIdentifier();
    if (!userId) {
      console.log('❌ No user ID - cannot test setup');
      return;
    }
    
    console.log('🔧 Setting up biometric manually with PIN:', testPin);
    
    // Store PIN
    const storeResult = await storeSecurePin(testPin, userId);
    console.log('- PIN stored:', storeResult);
    
    // Set preferences
    await setBiometricPreference(true, userId);
    console.log('- Preference set to true');
    
    // Mark setup complete
    await setBiometricSetupCompleted(userId);
    console.log('- Setup marked complete');
    
    // Check if it worked
    const availability = await isBiometricAuthAvailable();
    console.log('- Now available:', availability.available);
    console.log('- Reason:', availability.reason);
    
    console.log('🛠️ === MANUAL SETUP TEST END ===');
    
  } catch (error) {
    console.error('💥 Setup Test Error:', error);
  }
};

// Clear all biometric data
export const clearBiometricDebug = async () => {
  console.log('🧹 Clearing all biometric data...');
  
  try {
    const userId = await getUserIdentifier();
    if (userId) {
      const keys = [
        `biometric_auth_enabled_${userId}`,
        `biometric_setup_completed_${userId}`,
      ];
      
      await AsyncStorage.multiRemove(keys);
      
      // Clear secure PIN (this might fail silently)
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync(`user_encrypted_pin_${userId}`);
      } catch (e) {
        console.log('Note: Could not clear secure PIN (normal if none stored)');
      }
      
      console.log('✅ Biometric data cleared');
    }
  } catch (error) {
    console.error('Error clearing biometric data:', error);
  }
};