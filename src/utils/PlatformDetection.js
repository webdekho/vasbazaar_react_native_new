export const PlatformDetection = {
  isIOS: () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isAndroid: () => {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  },

  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return PlatformDetection.isIOS() || PlatformDetection.isAndroid();
  },

  isSafari: () => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  isInStandaloneMode: () => {
    if (typeof window === 'undefined') return false;
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  },

  canInstallPWA: () => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && !PlatformDetection.isInStandaloneMode();
  },

  getPlatformType: () => {
    if (PlatformDetection.isIOS()) return 'ios';
    if (PlatformDetection.isAndroid()) return 'android';
    return 'web';
  }
};