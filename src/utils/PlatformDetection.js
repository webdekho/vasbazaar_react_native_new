/**
 * Platform Detection Utilities
 * 
 * This module provides utility functions for detecting the current platform,
 * device type, browser capabilities, and PWA (Progressive Web App) support.
 * All functions are designed to work safely in both browser and server environments.
 * 
 * @module PlatformDetection
 */

/**
 * Platform detection utility object containing various detection methods
 * @namespace PlatformDetection
 */
export const PlatformDetection = {
  /**
   * Detects if the current platform is iOS
   * 
   * @method isIOS
   * @returns {boolean} True if running on iOS device (iPad, iPhone, iPod)
   * @example
   * if (PlatformDetection.isIOS()) {
   *   // iOS-specific code
   * }
   */
  isIOS: () => {
    try {
      if (typeof window === 'undefined' || !navigator?.userAgent) return false;
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    } catch (error) {
      return false;
    }
  },

  /**
   * Detects if the current platform is Android
   * 
   * @method isAndroid
   * @returns {boolean} True if running on Android device
   * @example
   * if (PlatformDetection.isAndroid()) {
   *   // Android-specific code
   * }
   */
  isAndroid: () => {
    try {
      if (typeof window === 'undefined' || !navigator?.userAgent) return false;
      return /Android/.test(navigator.userAgent);
    } catch (error) {
      return false;
    }
  },

  /**
   * Detects if the current platform is a mobile device
   * 
   * @method isMobile
   * @returns {boolean} True if running on iOS or Android
   * @example
   * if (PlatformDetection.isMobile()) {
   *   // Mobile-optimized layout
   * }
   */
  isMobile: () => {
    try {
      if (typeof window === 'undefined') return false;
      return PlatformDetection.isIOS() || PlatformDetection.isAndroid();
    } catch (error) {
      return false;
    }
  },

  /**
   * Detects if the current browser is Safari
   * 
   * @method isSafari
   * @returns {boolean} True if running in Safari browser
   * @example
   * if (PlatformDetection.isSafari()) {
   *   // Safari-specific workarounds
   * }
   */
  isSafari: () => {
    try {
      if (typeof window === 'undefined' || !navigator?.userAgent) return false;
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    } catch (error) {
      return false;
    }
  },

  /**
   * Detects if the app is running in standalone/PWA mode
   * 
   * @method isInStandaloneMode
   * @returns {boolean} True if running as standalone PWA
   * @example
   * if (PlatformDetection.isInStandaloneMode()) {
   *   // Hide install prompt
   * }
   */
  isInStandaloneMode: () => {
    try {
      if (typeof window === 'undefined') return false;
      return window.navigator?.standalone === true || 
             window.matchMedia?.('(display-mode: standalone)')?.matches === true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Detects if PWA installation is possible
   * 
   * @method canInstallPWA
   * @returns {boolean} True if PWA can be installed
   * @example
   * if (PlatformDetection.canInstallPWA()) {
   *   // Show install prompt
   * }
   */
  canInstallPWA: () => {
    try {
      if (typeof window === 'undefined') return false;
      return 'serviceWorker' in navigator && !PlatformDetection.isInStandaloneMode();
    } catch (error) {
      return false;
    }
  },

  /**
   * Gets the platform type as a string
   * 
   * @method getPlatformType
   * @returns {'ios'|'android'|'web'} The platform type
   * @example
   * const platform = PlatformDetection.getPlatformType();
   * switch (platform) {
   *   case 'ios': // iOS logic; break;
   *   case 'android': // Android logic; break;
   *   case 'web': // Web logic; break;
   * }
   */
  getPlatformType: () => {
    try {
      if (PlatformDetection.isIOS()) return 'ios';
      if (PlatformDetection.isAndroid()) return 'android';
      return 'web';
    } catch (error) {
      return 'web';
    }
  }
};

export default PlatformDetection;