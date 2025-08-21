import CrashReportingService from '../Services/CrashReportingService';

/**
 * Global error handler for async operations
 */
export const handleAsyncError = (error, context = '', additionalInfo = {}) => {
  console.error(`Async Error [${context}]:`, error);
  
  // Log to crash reporting
  CrashReportingService.logError(error, `Async Error - ${context}`);
  
  // Log additional context
  CrashReportingService.logEvent('async_error', {
    context,
    error_message: error.message,
    ...additionalInfo
  });
};

/**
 * Wrapper for API calls with error handling
 */
export const safeApiCall = async (apiFunction, context = '', showUserError = true) => {
  try {
    return await apiFunction();
  } catch (error) {
    console.error(`API Error [${context}]:`, error);
    
    // Log to crash reporting
    CrashReportingService.logError(error, `API Error - ${context}`);
    
    // Log API error event
    CrashReportingService.logEvent('api_error', {
      context,
      error_message: error.message,
      status_code: error.response?.status || 'unknown',
      endpoint: error.config?.url || 'unknown'
    });
    
    // Re-throw the error so calling code can handle UI updates
    throw error;
  }
};

/**
 * Log user actions for debugging purposes
 */
export const logUserAction = (action, screenName, additionalData = {}) => {
  CrashReportingService.logEvent('user_action', {
    action,
    screen: screenName,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

/**
 * Log navigation events
 */
export const logNavigation = (fromScreen, toScreen, params = {}) => {
  CrashReportingService.logEvent('navigation', {
    from_screen: fromScreen,
    to_screen: toScreen,
    has_params: Object.keys(params).length > 0,
    timestamp: new Date().toISOString()
  });
};

export default {
  handleAsyncError,
  safeApiCall,
  logUserAction,
  logNavigation
};