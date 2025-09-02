/**
 * Auth Event System for handling logout globally
 */

class AuthEventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
      }
    });
  }

  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Create singleton instance
export const authEvents = new AuthEventEmitter();

// Event constants
export const AUTH_EVENTS = {
  LOGOUT: 'auth:logout',
  LOGIN: 'auth:login',
  SESSION_EXPIRED: 'auth:session_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed'
};