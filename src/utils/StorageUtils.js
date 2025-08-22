/**
 * Storage Utility Functions
 * 
 * This module provides utility functions for managing storage operations,
 * particularly session management and authentication token handling.
 * 
 * @module StorageUtils
 */

// React imports
import { useContext } from 'react';

// Local imports
import { AuthContext } from '../context/AuthContext';

/**
 * Clears the session token on application start
 * 
 * This function retrieves the authentication context and clears any existing
 * session token. It's typically called when the application starts to ensure
 * a clean authentication state.
 * 
 * @async
 * @function clearSessionOnStart
 * @returns {Promise<void>} Promise that resolves when session is cleared
 * @throws {Error} Throws error if session clearing fails
 * 
 * @example
 * // Clear session on app startup
 * await clearSessionOnStart();
 */
export const clearSessionOnStart = async () => {
  const authContext = useContext(AuthContext);
  const { ClearSessionToken } = authContext;
  
  try {
    await ClearSessionToken();
  } catch (error) {
    // Re-throw with more context for proper error handling
    throw new Error(`Failed to clear session token: ${error.message}`);
  }
};