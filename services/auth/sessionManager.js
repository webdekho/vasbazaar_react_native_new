import AsyncStorage from '@react-native-async-storage/async-storage';

// Session token manager with automatic expiration

const SESSION_TOKEN_KEY = 'sessionToken';
const SESSION_EXPIRY_KEY = 'sessionExpiry';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Prevent excessive session checks
let lastSessionCheck = 0;
const SESSION_CHECK_THROTTLE = 1000; // 1 second throttle

/**
 * Save session token with expiration time
 * @param {string} token - Session token to save
 */
export const saveSessionToken = async (token) => {
  try {
    const expiryTime = Date.now() + SESSION_DURATION;
    
    await AsyncStorage.multiSet([
      [SESSION_TOKEN_KEY, token],
      [SESSION_EXPIRY_KEY, expiryTime.toString()]
    ]);

  } catch (error) {
  }
};

/**
 * Get session token if it's still valid
 * @returns {string|null} Valid session token or null if expired
 */
export const getSessionToken = async () => {
  try {
    // Throttle session checks to prevent excessive calls
    const now = Date.now();
    if (now - lastSessionCheck < SESSION_CHECK_THROTTLE) {
      // Return cached result for rapid successive calls
      const cachedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      const cachedExpiry = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (cachedToken && cachedExpiry && now < parseInt(cachedExpiry)) {
        return cachedToken;
      }
      return null;
    }
    
    lastSessionCheck = now;

    const [token, expiryTime] = await AsyncStorage.multiGet([
      SESSION_TOKEN_KEY,
      SESSION_EXPIRY_KEY
    ]);

    const sessionToken = token[1];
    const expiry = parseInt(expiryTime[1]);

    // Check if token exists and is not expired
    if (sessionToken && expiry && Date.now() < expiry) {
      return sessionToken;
    }

    // Token is expired or doesn't exist, clear it
    await clearExpiredSession(true); // Silent clear to avoid spam logs
    return null;

  } catch (error) {
    return null;
  }
};

/**
 * Clear expired session data
 */
export const clearExpiredSession = async (silent = false) => {
  try {
    await AsyncStorage.multiRemove([
      SESSION_TOKEN_KEY,
      SESSION_EXPIRY_KEY,
      'userData' // Also clear user data when session expires
    ]);
    if (!silent) {
    }
  } catch (error) {
    if (!silent) {
    }
  }
};

/**
 * Check if session is still valid
 * @returns {boolean} True if session is valid
 */
export const isSessionValid = async () => {
  const token = await getSessionToken();
  return token !== null;
};

/**
 * Get remaining session time in minutes
 * @returns {number} Remaining minutes or 0 if expired
 */
export const getRemainingSessionTime = async () => {
  try {
    const expiryTime = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!expiryTime) {
      return 0;
    }

    const remaining = parseInt(expiryTime) - Date.now();
    return remaining > 0 ? Math.ceil(remaining / (1000 * 60)) : 0;

  } catch (error) {
    return 0;
  }
};

/**
 * Extend session by another 30 minutes
 * @returns {boolean} True if session was extended successfully
 */
export const extendSession = async () => {
  try {
    const currentToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    
    if (currentToken) {
      const newExpiryTime = Date.now() + SESSION_DURATION;
      await AsyncStorage.setItem(SESSION_EXPIRY_KEY, newExpiryTime.toString());

      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Manual logout - clear only permanentToken and session tokens to force re-authentication
 */
export const logout = async () => {
  try {
    // Remove permanentToken and session tokens only - keep other data intact
    await AsyncStorage.multiRemove([
      'permanentToken',
      SESSION_TOKEN_KEY,
      SESSION_EXPIRY_KEY
    ]);
  } catch (error) {
  }
};