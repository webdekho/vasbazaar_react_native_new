import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionToken, clearExpiredSession, extendSession, getRemainingSessionTime } from './sessionManager';

/**
 * Session Timeout Service
 * Manages automatic session expiration and cleanup
 */

const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const SESSION_TIMEOUT_KEY = 'sessionTimeoutActive';

let sessionTimeoutInterval = null;
let onSessionExpiredCallback = null;

/**
 * Start session timeout monitoring
 * @param {Function} onExpired - Callback when session expires
 */
export const startSessionTimeout = (onExpired = null) => {
  console.log('🕐 Starting session timeout monitoring (30 minutes)');
  
  onSessionExpiredCallback = onExpired;
  
  // Clear any existing interval
  stopSessionTimeout();
  
  // Mark session timeout as active
  AsyncStorage.setItem(SESSION_TIMEOUT_KEY, 'true').catch(console.warn);
  
  // Start monitoring
  sessionTimeoutInterval = setInterval(checkSessionStatus, SESSION_CHECK_INTERVAL);
  
  // Initial check
  setTimeout(checkSessionStatus, 1000);
};

/**
 * Stop session timeout monitoring
 */
export const stopSessionTimeout = () => {
  console.log('🛑 Stopping session timeout monitoring');
  
  if (sessionTimeoutInterval) {
    clearInterval(sessionTimeoutInterval);
    sessionTimeoutInterval = null;
  }
  
  onSessionExpiredCallback = null;
  
  // Mark session timeout as inactive
  AsyncStorage.removeItem(SESSION_TIMEOUT_KEY).catch(console.warn);
};

/**
 * Check current session status and handle expiry
 */
const checkSessionStatus = async () => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      // Session has expired
      console.log('⏰ Session expired - triggering logout');
      await handleSessionExpiry();
      return;
    }
    
    const remainingMinutes = await getRemainingSessionTime();
    console.log(`🕐 Session check: ${remainingMinutes} minutes remaining`);
    
  } catch (error) {
    console.error('Error checking session status:', error);
  }
};

const handleSessionExpiry = async () => {
  console.log('🚨 Handling session expiry');
  
  // Stop monitoring
  stopSessionTimeout();
  
  // Clear expired session data
  await clearExpiredSession();
  
  // Clear any biometric session locks
  try {
    await AsyncStorage.removeItem('biometric_session_active');
  } catch (error) {
    console.warn('Could not clear biometric session:', error);
  }
  
  // Trigger callback if provided (no alert dialog)
  if (onSessionExpiredCallback) {
    onSessionExpiredCallback();
  }
};

/**
 * Extend current session (called from other parts of the app)
 * @returns {Promise<boolean>} Success status
 */
export const extendCurrentSession = async () => {
  console.log('🔄 Extending current session...');
  
  const extended = await extendSession();
  
  if (extended) {
    console.log('✅ Session extended via API call');
  }
  
  return extended;
};

/**
 * Check if session timeout is currently active
 * @returns {Promise<boolean>} True if timeout monitoring is active
 */
export const isSessionTimeoutActive = async () => {
  try {
    const active = await AsyncStorage.getItem(SESSION_TIMEOUT_KEY);
    return active === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Get human-readable time remaining
 * @returns {Promise<string>} Formatted time remaining
 */
export const getFormattedTimeRemaining = async () => {
  try {
    const minutes = await getRemainingSessionTime();
    
    if (minutes <= 0) {
      return 'Expired';
    }
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
    
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Silent session expiry - only clear data without alerts
 */
export const silentSessionExpiry = async () => {
  console.log('🔕 Silent session expiry');
  
  // Stop monitoring
  stopSessionTimeout();
  
  // Clear expired session data
  await clearExpiredSession();
  
  // Clear any biometric session locks
  try {
    await AsyncStorage.removeItem('biometric_session_active');
  } catch (error) {
    console.warn('Could not clear biometric session:', error);
  }
};