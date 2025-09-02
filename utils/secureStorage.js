import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Secure storage keys
const SECURE_PIN_KEY = 'user_encrypted_pin';
const BIOMETRIC_PREFERENCE_KEY = 'biometric_auth_enabled';
const BIOMETRIC_SETUP_COMPLETED_KEY = 'biometric_setup_completed';

/**
 * Store user PIN securely in device keychain/keystore
 * @param {string} pin - 4 digit PIN to store
 * @param {string} userId - User identifier for key uniqueness
 * @returns {Promise<boolean>} Success status
 */
export const storeSecurePin = async (pin, userId) => {
  try {
    const secureKey = `${SECURE_PIN_KEY}_${userId}`;
    await SecureStore.setItemAsync(secureKey, pin, {
      requireAuthentication: false, // Don't require auth to store
      keychainService: 'com.vasbazaar.app.pin', // Custom keychain service
    });
    
    console.log('PIN stored securely for user:', userId);
    return true;
  } catch (error) {
    console.error('Error storing secure PIN:', error);
    return false;
  }
};

/**
 * Retrieve user PIN securely from device keychain/keystore
 * @param {string} userId - User identifier
 * @returns {Promise<string|null>} PIN or null if not found
 */
export const getSecurePin = async (userId) => {
  try {
    const secureKey = `${SECURE_PIN_KEY}_${userId}`;
    const pin = await SecureStore.getItemAsync(secureKey, {
      requireAuthentication: false,
      keychainService: 'com.vasbazaar.app.pin',
    });
    
    return pin;
  } catch (error) {
    console.error('Error retrieving secure PIN:', error);
    return null;
  }
};

/**
 * Delete stored PIN from secure storage
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} Success status
 */
export const deleteSecurePin = async (userId) => {
  try {
    const secureKey = `${SECURE_PIN_KEY}_${userId}`;
    await SecureStore.deleteItemAsync(secureKey, {
      keychainService: 'com.vasbazaar.app.pin',
    });
    
    console.log('PIN deleted securely for user:', userId);
    return true;
  } catch (error) {
    console.error('Error deleting secure PIN:', error);
    return false;
  }
};

/**
 * Check if PIN is stored securely for user
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} True if PIN exists
 */
export const hasSecurePin = async (userId) => {
  try {
    const pin = await getSecurePin(userId);
    return pin !== null && pin.length === 4;
  } catch (error) {
    console.error('Error checking secure PIN:', error);
    return false;
  }
};

/**
 * Set biometric authentication preference
 * @param {boolean} enabled - Whether biometric auth is enabled
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} Success status
 */
export const setBiometricPreference = async (enabled, userId) => {
  try {
    const key = `${BIOMETRIC_PREFERENCE_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      enabled,
      timestamp: Date.now(),
      platform: Platform.OS,
    }));
    
    console.log('Biometric preference set:', { enabled, userId });
    return true;
  } catch (error) {
    console.error('Error setting biometric preference:', error);
    return false;
  }
};

/**
 * Get biometric authentication preference
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} True if biometric auth is enabled
 */
export const getBiometricPreference = async (userId) => {
  try {
    const key = `${BIOMETRIC_PREFERENCE_KEY}_${userId}`;
    const preference = await AsyncStorage.getItem(key);
    
    if (preference) {
      const { enabled } = JSON.parse(preference);
      return enabled === true;
    }
    
    // Default to false if no preference set
    return false;
  } catch (error) {
    console.error('Error getting biometric preference:', error);
    return false;
  }
};

/**
 * Mark biometric setup as completed
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} Success status
 */
export const setBiometricSetupCompleted = async (userId) => {
  try {
    const key = `${BIOMETRIC_SETUP_COMPLETED_KEY}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      completed: true,
      timestamp: Date.now(),
      platform: Platform.OS,
    }));
    
    return true;
  } catch (error) {
    console.error('Error setting biometric setup completed:', error);
    return false;
  }
};

/**
 * Check if biometric setup is completed
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} True if setup is completed
 */
export const isBiometricSetupCompleted = async (userId) => {
  try {
    const key = `${BIOMETRIC_SETUP_COMPLETED_KEY}_${userId}`;
    const setup = await AsyncStorage.getItem(key);
    
    if (setup) {
      const { completed } = JSON.parse(setup);
      return completed === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking biometric setup:', error);
    return false;
  }
};

/**
 * Clear all biometric data for user (logout/reset)
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} Success status
 */
export const clearBiometricData = async (userId) => {
  try {
    // Clear secure PIN
    await deleteSecurePin(userId);
    
    // Clear preferences
    const keys = [
      `${BIOMETRIC_PREFERENCE_KEY}_${userId}`,
      `${BIOMETRIC_SETUP_COMPLETED_KEY}_${userId}`,
    ];
    
    await AsyncStorage.multiRemove(keys);
    
    console.log('Biometric data cleared for user:', userId);
    return true;
  } catch (error) {
    console.error('Error clearing biometric data:', error);
    return false;
  }
};

/**
 * Get user identifier from stored data
 * Enhanced to check multiple sources for user data and migrate biometric data
 * @returns {Promise<string|null>} User mobile number or ID
 */
export const getUserIdentifier = async () => {
  try {
    console.log('🔍 Getting user identifier...');
    
    // Try getting from userData first
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const identifier = user.mobile || user.id || null;
      console.log('✅ Found user identifier from userData:', identifier);
      return identifier;
    }
    
    // Fallback: Try getting from permanentToken (sometimes contains mobile)
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    if (permanentToken) {
      // Check if aadhaarData has mobile
      const aadhaarData = await AsyncStorage.getItem('aadhaarData');
      if (aadhaarData) {
        const aadhaar = JSON.parse(aadhaarData);
        if (aadhaar.mobile) {
          console.log('✅ Found user identifier from aadhaarData:', aadhaar.mobile);
          return aadhaar.mobile;
        }
      }
      
      // As last resort, use a hash of permanent token as identifier
      // This ensures consistency across sessions
      const tokenBasedId = `user_${permanentToken.substring(0, 16)}`;
      console.log('⚠️ Using token-based identifier:', tokenBasedId);
      
      // Check if we need to migrate biometric data from mobile-based to token-based storage
      await migrateBiometricDataIfNeeded(tokenBasedId);
      
      return tokenBasedId;
    }
    
    console.log('❌ No user identifier found');
    return null;
  } catch (error) {
    console.error('❌ Error getting user identifier:', error);
    return null;
  }
};

/**
 * Migrate biometric data from mobile-based identifier to token-based identifier
 * This handles cases where user data changes between sessions
 */
const migrateBiometricDataIfNeeded = async (tokenBasedId) => {
  try {
    // Check if token-based identifier already has biometric data
    const tokenBiometricEnabled = await getBiometricPreference(tokenBasedId);
    const tokenBiometricSetup = await isBiometricSetupCompleted(tokenBasedId);
    const tokenPin = await getSecurePin(tokenBasedId);
    
    // If token-based already has data, no migration needed
    if (tokenBiometricEnabled && tokenBiometricSetup && tokenPin) {
      console.log('🔄 Token-based biometric data already exists - no migration needed');
      return;
    }
    
    // Look for any mobile-number based biometric data to migrate
    const allKeys = await AsyncStorage.getAllKeys();
    const biometricKeys = allKeys.filter(key => 
      key.includes('biometric_auth_enabled_') || 
      key.includes('biometric_setup_completed_')
    );
    
    for (const key of biometricKeys) {
      const originalId = key.split('_').pop(); // Get the user ID from the key
      
      // Skip if it's already the token-based ID
      if (originalId === tokenBasedId || !originalId.match(/^\d+$/)) continue;
      
      console.log('🔄 Found biometric data for mobile ID:', originalId);
      
      // Check if this mobile ID has complete biometric setup
      const mobileBiometricEnabled = await getBiometricPreference(originalId);
      const mobileBiometricSetup = await isBiometricSetupCompleted(originalId);
      const mobilePin = await getSecurePin(originalId);
      
      if (mobileBiometricEnabled && mobileBiometricSetup && mobilePin) {
        console.log('🔄 Migrating biometric data from mobile ID to token ID...');
        
        // Copy data to token-based identifier
        await setBiometricPreference(true, tokenBasedId);
        await setBiometricSetupCompleted(tokenBasedId);
        await storeSecurePin(mobilePin, tokenBasedId);
        
        console.log('✅ Biometric data migration completed successfully');
        break; // Only migrate from the first valid mobile ID found
      }
    }
  } catch (error) {
    console.error('❌ Error during biometric data migration:', error);
  }
};