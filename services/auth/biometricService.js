/**
 * Biometric Authentication Service for vasbazaar
 * 
 * TROUBLESHOOTING GUIDE FOR ANDROID/EXPO GO:
 * 
 * 1. EXPO GO LIMITATIONS:
 *    - Biometric authentication may not work fully in Expo Go development environment
 *    - Some Android devices may have limited biometric support in Expo Go
 *    - For full functionality, build a standalone/production APK
 * 
 * 2. ANDROID REQUIREMENTS:
 *    - Device must have fingerprint scanner or face unlock enabled
 *    - User must have at least one biometric enrolled in device settings
 *    - App must have USE_BIOMETRIC and USE_FINGERPRINT permissions (configured in app.json)
 * 
 * 3. COMMON ISSUES:
 *    - "Not available": Device doesn't support biometrics or no biometrics enrolled
 *    - "Not enrolled": User needs to set up fingerprint/face unlock in device settings
 *    - "Permission denied": Check app.json permissions configuration
 *    - "Not supported": May need production build instead of Expo Go
 * 
 * 4. DEBUGGING STEPS:
 *    - Check console logs for detailed biometric support information
 *    - Verify device has biometrics enabled in Settings > Security
 *    - Try both fingerprint and face unlock if available
 *    - Test on different Android devices if possible
 *    - Consider building development build with `eas build --profile development`
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global biometric session manager to prevent concurrent authentications
let biometricAuthInProgress = false;
let lastBiometricAttempt = 0;
const BIOMETRIC_COOLDOWN = 2000; // 2 second cooldown between attempts
const BIOMETRIC_SESSION_KEY = 'biometric_session_active';
import { 
  storeSecurePin, 
  getSecurePin, 
  deleteSecurePin,
  setBiometricPreference,
  getBiometricPreference,
  setBiometricSetupCompleted,
  isBiometricSetupCompleted,
  clearBiometricData,
  getUserIdentifier
} from '../../utils/secureStorage';

/**
 * Check if device supports biometric authentication
 * Enhanced for Expo Go compatibility
 * @returns {Promise<Object>} Biometric support information
 */
export const checkBiometricSupport = async () => {
  try {
    
    // Check if device has hardware support
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    
    // Check if biometric records are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    // Get available authentication types
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    // Get security level (may not be available on all Android devices in Expo Go)
    let securityLevel = 0;
    try {
      securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    } catch (securityError) {
    }
    
    // Enhanced availability check for both platforms
    const isAvailable = hasHardware && isEnrolled;
    const authTypes = getAuthenticationTypeNames(supportedTypes);
    
    const result = {
      hasHardware,
      isEnrolled,
      supportedTypes,
      securityLevel,
      isAvailable,
      authTypes,
      // Additional info for debugging
      platform: Platform.OS,
      isExpoGo: __DEV__ && Platform.OS === 'android', // Likely Expo Go if dev mode on Android
      isIOSDev: __DEV__ && Platform.OS === 'ios', // iOS development mode
    };
    
    console.log('🔍 Biometric Support Check:', {
      Platform: Platform.OS,
      hasHardware,
      isEnrolled,
      supportedTypes,
      authTypes,
      isAvailable,
      securityLevel,
      isExpoGo: result.isExpoGo,
      isDev: __DEV__
    });
    
    // Additional iOS-specific debugging
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS Biometric Details:', {
        hasHardware,
        isEnrolled,
        availableTypes: supportedTypes,
        authTypeNames: authTypes,
        computed_isAvailable: hasHardware && isEnrolled,
        securityLevel,
        developmentMode: __DEV__
      });
    }
    
    return result;
  } catch (error) {
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      securityLevel: 0,
      isAvailable: false,
      authTypes: [],
      error: error.message,
      platform: Platform.OS,
    };
  }
};

/**
 * iOS-specific biometric debugging to identify Face ID/Touch ID issues
 * @returns {Promise<Object>} iOS-specific debug info
 */
export const debugIOSBiometrics = async () => {
  if (Platform.OS !== 'ios') {
    return { error: 'This function is iOS-specific' };
  }

  const debug = {
    platform: 'ios',
    timestamp: new Date().toISOString(),
    isDev: __DEV__,
  };

  try {
    // Check basic availability
    debug.hasHardware = await LocalAuthentication.hasHardwareAsync();
    debug.isEnrolled = await LocalAuthentication.isEnrolledAsync();
    debug.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    debug.authTypeNames = getAuthenticationTypeNames(debug.supportedTypes);

    // Check security level
    try {
      debug.securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    } catch (error) {
      debug.securityLevelError = error.message;
    }

    // Try a simple authentication test
    try {
      const testResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Testing Face ID/Touch ID availability',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      debug.testAuth = testResult;
    } catch (testError) {
      debug.testAuthError = testError.message;
    }

    return debug;

  } catch (error) {
    debug.error = error.message;
    return debug;
  }
};

/**
 * Debug utility to get detailed biometric information
 * Call this function to troubleshoot biometric issues
 * @returns {Promise<Object>} Detailed biometric debug info
 */
export const debugBiometricInfo = async () => {
  const debug = {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    isExpoGo: __DEV__ && Platform.OS === 'android',
  };

  try {
    // Basic checks
    debug.hasHardware = await LocalAuthentication.hasHardwareAsync();
    debug.isEnrolled = await LocalAuthentication.isEnrolledAsync();
    debug.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    debug.authTypeNames = getAuthenticationTypeNames(debug.supportedTypes);

    // Security level (may fail on Expo Go)
    try {
      debug.securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    } catch (error) {
      debug.securityLevelError = error.message;
    }

    // User preferences
    try {
      const userId = await getUserIdentifier();
      if (userId) {
        debug.userId = userId;
        debug.biometricEnabled = await getBiometricPreference(userId);
        debug.setupCompleted = await isBiometricSetupCompleted(userId);
        debug.hasPinStored = !!(await getSecurePin(userId));
      }
    } catch (error) {
      debug.userPreferencesError = error.message;
    }

    return debug;

  } catch (error) {
    debug.error = error.message;
    return debug;
  }
};

/**
 * Convert authentication type constants to readable names
 * @param {Array} types - Array of authentication type constants
 * @returns {Array} Array of readable authentication type names
 */
const getAuthenticationTypeNames = (types) => {
  const typeNames = [];
  
  types.forEach(type => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        typeNames.push('Fingerprint');
        break;
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        typeNames.push(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
        break;
      case LocalAuthentication.AuthenticationType.IRIS:
        typeNames.push('Iris');
        break;
      default:
        typeNames.push('Biometric');
    }
  });
  
  return typeNames;
};

/**
 * Get appropriate biometric prompt message based on device capabilities
 * @param {Array} authTypes - Available authentication types
 * @returns {string} Prompt message
 */
const getBiometricPromptMessage = (authTypes) => {
  if (authTypes.includes('Face ID')) {
    return 'Use Face ID to access your account';
  } else if (authTypes.includes('Fingerprint')) {
    return 'Use your fingerprint to access your account';
  } else if (authTypes.includes('Face Recognition')) {
    return 'Use face recognition to access your account';
  } else {
    return 'Use biometric authentication to access your account';
  }
};

/**
 * Prompt user for biometric authentication
 * Enhanced for Expo Go and Android compatibility
 * @param {Object} options - Authentication options
 * @returns {Promise<Object>} Authentication result
 */
export const authenticateWithBiometrics = async (options = {}) => {
  // Enhanced protection against concurrent biometric attempts
  const currentTime = Date.now();
  
  // Check AsyncStorage for persistent session lock
  try {
    const sessionActive = await AsyncStorage.getItem(BIOMETRIC_SESSION_KEY);
    if (sessionActive) {
      const sessionTime = parseInt(sessionActive, 10);
      if (currentTime - sessionTime < 5000) { // 5 second persistent lock
        return {
          success: false,
          error: 'Authentication session locked',
          reason: 'Previous biometric session still active',
        };
      } else {
        // Clear expired session lock
        await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
      }
    }
  } catch (error) {
  }
  
  if (biometricAuthInProgress) {
    return {
      success: false,
      error: 'Authentication already in progress',
      reason: 'Another biometric authentication is currently active',
    };
  }

  if (currentTime - lastBiometricAttempt < BIOMETRIC_COOLDOWN) {
    return {
      success: false,
      error: 'Authentication rate limited',
      reason: 'Please wait before trying again',
    };
  }

  try {
    biometricAuthInProgress = true; // Set global flag
    lastBiometricAttempt = currentTime;
    
    // Set persistent session lock
    await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, currentTime.toString());
    
    const support = await checkBiometricSupport();
    
    console.log('🔐 Biometric Authentication Attempt:', {
      Platform: Platform.OS,
      support: support,
      isAvailable: support.isAvailable
    });
    
    if (!support.isAvailable) {
      const reason = !support.hasHardware 
        ? 'Device does not support biometric authentication' 
        : 'No biometric credentials enrolled on device';
      
      console.log('❌ Biometric not available:', {
        hasHardware: support.hasHardware,
        isEnrolled: support.isEnrolled,
        reason: reason
      });
      
      return {
        success: false,
        error: 'Biometric authentication not available',
        reason,
        supportInfo: support,
      };
    }
    
    // Enhanced options for cross-platform compatibility
    const defaultOptions = {
      promptMessage: getBiometricPromptMessage(support.authTypes),
      cancelLabel: 'Use PIN instead',
      disableDeviceFallback: false, // Allow device fallback on both platforms
      requireConfirmation: false, // Disable confirmation to reduce friction
      // Platform-specific options
      ...(Platform.OS === 'android' && {
        fallbackLabel: 'Use Password',
      }),
      ...(Platform.OS === 'ios' && {
        fallbackLabel: 'Enter PIN',
        // iOS-specific options for better compatibility
        localizedFallbackTitle: 'Use PIN',
      }),
    };
    
    const authOptions = { ...defaultOptions, ...options };
    
    console.log('🔐 Starting LocalAuthentication.authenticateAsync with options:', {
      Platform: Platform.OS,
      authOptions: authOptions,
      supportedTypes: support.supportedTypes,
      authTypes: support.authTypes
    });
    
    // Attempt authentication with enhanced error handling
    let result;
    try {
      result = await LocalAuthentication.authenticateAsync({
        promptMessage: authOptions.promptMessage,
        cancelLabel: authOptions.cancelLabel,
        disableDeviceFallback: authOptions.disableDeviceFallback,
        requireConfirmation: authOptions.requireConfirmation,
        ...(Platform.OS === 'android' && authOptions.fallbackLabel && {
          fallbackLabel: authOptions.fallbackLabel,
        }),
        ...(Platform.OS === 'ios' && {
          fallbackLabel: authOptions.fallbackLabel,
          localizedFallbackTitle: authOptions.localizedFallbackTitle,
        }),
      });
      
      console.log('🔐 LocalAuthentication.authenticateAsync result:', result);
    } catch (authError) {
      console.log('🔐 LocalAuthentication.authenticateAsync error:', authError);
      
      // Handle platform-specific errors
      if (Platform.OS === 'ios') {
        // iOS-specific error handling
        if (authError.message?.includes('not available') || 
            authError.message?.includes('not supported') ||
            authError.message?.includes('not enrolled')) {
          return {
            success: false,
            error: 'Biometric authentication not available',
            reason: 'Face ID or Touch ID is not set up or available on this device',
            isIOSLimitation: true,
            message: authError.message,
            code: authError.code,
            platform: Platform.OS
          };
        }
        
        if (authError.message?.includes('permission') || 
            authError.message?.includes('denied')) {
          return {
            success: false,
            error: 'Biometric permission denied',
            reason: 'Please enable Face ID/Touch ID permission in Settings',
            isIOSPermissionIssue: true,
            message: authError.message,
            code: authError.code,
            platform: Platform.OS
          };
        }
        
        // iOS user cancellation
        if (authError.message?.includes('UserCancel') || authError.code === 'UserCancel') {
          return {
            success: false,
            error: 'User cancelled authentication',
            reason: 'User cancelled Face ID/Touch ID authentication',
            userCancel: true,
            iosCancellation: true,
            message: authError.message,
            code: authError.code,
            platform: Platform.OS
          };
        }
        
      } else {
        // Android-specific error handling
        if (authError.message?.includes('not available') || 
            authError.message?.includes('not supported')) {
          return {
            success: false,
            error: 'Biometric authentication not supported in current environment',
            reason: 'This feature may require a production build to work properly on Android',
            isExpoGoLimitation: true,
            message: authError.message,
            code: authError.code,
            platform: Platform.OS
          };
        }
      }
      
      // Generic error handling for unhandled cases
      return {
        success: false,
        error: 'Biometric authentication failed',
        reason: authError.message || 'Unknown error occurred during authentication',
        message: authError.message,
        code: authError.code,
        platform: Platform.OS
      };
    }
    
    
    console.log('🔐 Processing authentication result:', {
      success: result.success,
      error: result.error,
      warning: result.warning,
      platform: Platform.OS
    });
    
    if (result.success) {
      return {
        success: true,
        authType: support.authTypes[0] || 'Biometric',
        platform: Platform.OS,
      };
    } else {
      // Enhanced iOS error handling
      const isUserCancel = result.error === 'UserCancel' || 
                          result.error === 'user_cancel' ||
                          result.error === 'UserFallback';
      
      const isSystemCancel = result.error === 'SystemCancel' || 
                            result.error === 'system_cancel';
      
      const failureInfo = {
        success: false,
        error: result.error || 'Authentication failed',
        reason: getFailureReason(result.error),
        userCancel: isUserCancel,
        systemCancel: isSystemCancel,
        platform: Platform.OS,
        warning: result.warning,
        // iOS-specific cancellation handling
        ...(Platform.OS === 'ios' && {
          iosCancellation: isUserCancel
        })
      };
      
      return failureInfo;
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      reason: error.message?.includes('Expo Go') 
        ? 'Biometric authentication has limitations in Expo Go. Try building a standalone app.'
        : 'Unexpected error during biometric authentication',
      isExpoGoLimitation: error.message?.includes('Expo Go'),
      platform: Platform.OS,
    };
  } finally {
    // Always reset both global flag and AsyncStorage lock
    biometricAuthInProgress = false;
    try {
      await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
    } catch (error) {
    }
  }
};

/**
 * Reset biometric authentication session (emergency cleanup)
 * @returns {Promise<void>}
 */
export const resetBiometricSession = async () => {
  biometricAuthInProgress = false;
  lastBiometricAttempt = 0;
  
  try {
    await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
  } catch (error) {
  }
};

/**
 * Check if biometric authentication is currently in progress
 * @returns {boolean}
 */
export const isBiometricInProgress = () => {
  return biometricAuthInProgress;
};

/**
 * Get user-friendly failure reason
 * @param {string} error - Error code from authentication
 * @returns {string} User-friendly error message
 */
const getFailureReason = (error) => {
  switch (error) {
    case 'UserCancel':
      return 'Authentication cancelled by user';
    case 'SystemCancel':
      return 'Authentication cancelled by system';
    case 'AppCancel':
      return 'Authentication cancelled by app';
    case 'InvalidContext':
      return 'Authentication context is invalid';
    case 'NotMounted':
      return 'Authentication not properly mounted';
    case 'NotAvailable':
      return 'Biometric authentication not available';
    case 'NotEnrolled':
      return 'No biometric credentials enrolled';
    case 'LockOut':
      return 'Authentication locked due to too many attempts';
    case 'PermissionNotGranted':
      return 'Permission not granted for biometric authentication';
    default:
      return 'Authentication failed';
  }
};

/**
 * Setup biometric authentication for user
 * Automatically enables biometric after successful PIN validation
 * @param {string} pin - User's PIN to store securely
 * @returns {Promise<Object>} Setup result
 */
export const setupBiometricAuth = async (pin) => {
  try {
    const userId = await getUserIdentifier();
    if (!userId) {
      return {
        success: false,
        error: 'User identifier not found',
      };
    }
    
    // Check biometric support
    const support = await checkBiometricSupport();
    if (!support.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available',
        reason: support.error || 'Device does not support biometric authentication',
      };
    }
    
    
    // Store PIN securely first
    const storeResult = await storeSecurePin(pin, userId);
    if (!storeResult) {
      return {
        success: false,
        error: 'Failed to store PIN securely',
      };
    }
    
    
    // Enable biometric preference
    await setBiometricPreference(true, userId);
    await setBiometricSetupCompleted(userId);
    
    
    // Test if biometric authentication works (optional - don't fail setup if this fails)
    const authTypes = support.authTypes || ['Biometric'];
    
    return {
      success: true,
      authType: authTypes[0],
      message: 'Biometric authentication enabled successfully',
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      reason: 'Unexpected error during biometric setup',
    };
  }
};

/**
 * Authenticate user with biometrics and perform API login
 * @returns {Promise<Object>} Authentication result
 */
export const biometricLogin = async () => {
  try {
    
    const userId = await getUserIdentifier();
    if (!userId) {
      return {
        success: false,
        error: 'User identifier not found',
      };
    }
    
    // Check if biometric is enabled for user
    const isEnabled = await getBiometricPreference(userId);
    if (!isEnabled) {
      return {
        success: false,
        error: 'Biometric authentication not enabled',
        reason: 'User has disabled biometric authentication',
      };
    }
    
    // Check if permanent token exists
    const permanentToken = await AsyncStorage.getItem('permanentToken');
    if (!permanentToken) {
      return {
        success: false,
        error: 'No permanent token found',
        reason: 'Biometric authentication not set up properly',
      };
    }
    
    // Authenticate with biometrics
    const authResult = await authenticateWithBiometrics({
      promptMessage: 'Authenticate to access your account',
      cancelLabel: 'Use PIN instead',
    });
    
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        reason: authResult.reason,
        userCancel: authResult.userCancel,
        systemCancel: authResult.systemCancel,
      };
    }
    
    
    // Import the login service (dynamic import to avoid circular dependencies)
    const { loginWithBiometric } = await import('./biometricLoginService');
    
    // Call the biometric login API
    const loginResult = await loginWithBiometric(permanentToken);
    
    const finalResult = {
      success: loginResult.status === 'success',
      error: loginResult.status === 'error' ? loginResult.message : null,
      authType: authResult.authType,
      loginData: loginResult.data,
    };
    
    return finalResult;
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      reason: 'Unexpected error during biometric login',
    };
  }
};

/**
 * Check if biometric authentication is enabled and available for current user
 * @returns {Promise<Object>} Availability status
 */
export const isBiometricAuthAvailable = async () => {
  try {
    const userId = await getUserIdentifier();
    
    if (!userId) {
      return { 
        available: false, 
        reason: 'No user logged in',
        userId: null 
      };
    }
    
    // Check device support
    const support = await checkBiometricSupport();
    if (!support.isAvailable) {
      return { 
        available: false, 
        reason: 'Device does not support biometric authentication',
        deviceSupport: support,
        userId
      };
    }
    
    // Check user preference and setup
    const isEnabled = await getBiometricPreference(userId);
    const isSetup = await isBiometricSetupCompleted(userId);
    const hasPin = await getSecurePin(userId);
    
    // For first-time users with good device support, make biometric available for setup
    const deviceReady = support.isAvailable;
    const hasPinStored = !!hasPin; // Convert to boolean
    const userNotConfigured = !isEnabled || !isSetup || !hasPinStored;
    
    // If device is ready but user hasn't set up biometric, still show as available for setup
    const available = deviceReady && (isEnabled && isSetup && hasPinStored);
    const canSetup = deviceReady && userNotConfigured;
    
    console.log('🔍 Android Biometric Debug Info:', {
      Platform: Platform.OS,
      deviceReady,
      isEnabled,
      isSetup,
      hasPinStored,
      userNotConfigured,
      available,
      canSetup,
      supportInfo: support
    });
    
    return {
      available,
      canSetup,
      isEnabled,
      isSetup,
      hasPin: hasPinStored,
      deviceSupport: support,
      userId,
      reason: available 
        ? 'Available and ready' 
        : canSetup 
          ? 'Device ready - needs user setup' 
          : 'Not fully configured',
    };
    
  } catch (error) {
    return {
      available: false,
      canSetup: false,
      reason: 'Error checking biometric availability',
      error: error.message,
    };
  }
};

/**
 * Disable biometric authentication for current user
 * @returns {Promise<boolean>} Success status
 */
export const disableBiometricAuth = async () => {
  try {
    const userId = await getUserIdentifier();
    if (!userId) {
      return false;
    }
    
    // Clear all biometric data
    const result = await clearBiometricData(userId);
    
    return result;
  } catch (error) {
    return false;
  }
};

/**
 * Show biometric setup prompt to user
 * @param {Function} onSetup - Callback when user wants to setup
 * @param {Function} onSkip - Callback when user skips setup
 */
export const showBiometricSetupPrompt = async (onSetup, onSkip) => {
  const support = await checkBiometricSupport();
  
  if (!support.isAvailable) {
    // Don't show prompt if not available
    onSkip && onSkip();
    return;
  }
  
  const authTypeName = support.authTypes[0] || 'biometric authentication';
  
  Alert.alert(
    'Enable Quick Access',
    `Would you like to use ${authTypeName.toLowerCase()} for quick and secure access to your account?`,
    [
      {
        text: 'Skip',
        style: 'cancel',
        onPress: onSkip,
      },
      {
        text: 'Enable',
        onPress: onSetup,
      },
    ]
  );
};