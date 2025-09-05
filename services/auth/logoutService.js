import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

/**
 * Comprehensive logout service with multiple approaches
 */

// Approach 1: Clear only auth tokens while preserving user data
export const softLogout = async () => {
  try {
    console.log('[LogoutService] Starting soft logout...');
    
    // Clear only authentication-related data
    const keysToRemove = [
      'permanentToken',
      'sessionToken', 
      'sessionExpiry',
      'pinValidationSuccess',
      'otpValidationSuccess',
      'pinSetSuccess',
      'pwa_prompt_shown',
      'pwa_session_count',
      'pwa_prompt_dismissed',
      'pwa_pending_prompt'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('[LogoutService] Soft logout completed - auth tokens cleared');
    
    return { success: true, type: 'soft' };
  } catch (error) {
    console.error('[LogoutService] Soft logout error:', error);
    return { success: false, error };
  }
};

// Approach 2: Complete logout with all data cleared
export const hardLogout = async () => {
  try {
    console.log('[LogoutService] Starting hard logout...');
    
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    console.log('[LogoutService] Hard logout completed - all data cleared');
    
    return { success: true, type: 'hard' };
  } catch (error) {
    console.error('[LogoutService] Hard logout error:', error);
    return { success: false, error };
  }
};

// Approach 3: Selective logout preserving specific data
export const selectiveLogout = async (preserveKeys = ['userData', 'profile_photo']) => {
  try {
    console.log('[LogoutService] Starting selective logout...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter out keys to preserve
    const keysToRemove = allKeys.filter(key => !preserveKeys.includes(key));
    
    // Remove non-preserved keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    
    console.log(`[LogoutService] Selective logout completed - preserved: ${preserveKeys.join(', ')}`);
    
    return { success: true, type: 'selective', preserved: preserveKeys };
  } catch (error) {
    console.error('[LogoutService] Selective logout error:', error);
    return { success: false, error };
  }
};

// Approach 4: Smart logout with navigation reset
export const smartLogout = async (navigation) => {
  try {
    console.log('[LogoutService] Starting smart logout...');
    
    // Step 1: Clear auth tokens first
    await softLogout();
    
    // Step 2: Small delay to ensure storage operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Reset navigation stack completely
    if (navigation) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'auth/LoginScreen' }],
        })
      );
    }
    
    console.log('[LogoutService] Smart logout completed with navigation reset');
    
    return { success: true, type: 'smart' };
  } catch (error) {
    console.error('[LogoutService] Smart logout error:', error);
    return { success: false, error };
  }
};

// Approach 5: Force logout with app restart simulation
export const forceLogout = async () => {
  try {
    console.log('[LogoutService] Starting force logout...');
    
    // Clear critical auth data
    await AsyncStorage.multiRemove([
      'permanentToken',
      'sessionToken',
      'sessionExpiry',
      'pwa_prompt_shown',
      'pwa_session_count',
      'pwa_prompt_dismissed',
      'pwa_pending_prompt'
    ]);
    
    // Set a flag to indicate forced logout
    await AsyncStorage.setItem('forcedLogout', 'true');
    
    console.log('[LogoutService] Force logout completed - app restart required');
    
    return { success: true, type: 'force', requiresRestart: true };
  } catch (error) {
    console.error('[LogoutService] Force logout error:', error);
    return { success: false, error };
  }
};

// Main logout function that can use different strategies
export const performLogout = async (strategy = 'soft', options = {}) => {
  console.log(`[LogoutService] Performing logout with strategy: ${strategy}`);
  
  let result;
  
  switch (strategy) {
    case 'soft':
      result = await softLogout();
      break;
      
    case 'hard':
      result = await hardLogout();
      break;
      
    case 'selective':
      result = await selectiveLogout(options.preserveKeys);
      break;
      
    case 'smart':
      result = await smartLogout(options.navigation);
      break;
      
    case 'force':
      result = await forceLogout();
      break;
      
    default:
      result = await softLogout();
  }
  
  // Emit logout event for any listeners
  if (result.success && typeof options.onLogoutComplete === 'function') {
    options.onLogoutComplete(result);
  }
  
  return result;
};

// Utility to check if forced logout flag is set
export const checkForcedLogout = async () => {
  try {
    const forcedLogout = await AsyncStorage.getItem('forcedLogout');
    if (forcedLogout === 'true') {
      await AsyncStorage.removeItem('forcedLogout');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};