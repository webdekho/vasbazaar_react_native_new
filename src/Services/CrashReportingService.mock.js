// Temporary mock service for development testing (Firebase disabled)

class CrashReportingService {
  static initialize() {
    console.log('Crash reporting initialized (mock)');
  }

  static logError(error, context = '') {
    console.error('Error logged (mock):', error, context);
  }

  static logEvent(eventName, attributes = {}) {
    console.log('Event logged (mock):', eventName, attributes);
  }

  static setUser(userId, userAttributes = {}) {
    console.log('User set (mock):', userId, userAttributes);
  }

  static clearUser() {
    console.log('User cleared (mock)');
  }

  static testCrash() {
    console.warn('Test crash called (mock) - no effect in development');
  }
}

export default CrashReportingService;