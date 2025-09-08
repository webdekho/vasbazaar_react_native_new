import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PWA_INSTALLED: 'pwa_installed',
  LAST_DISMISSED: 'pwa_last_dismissed', 
  PERMANENTLY_DISMISSED: 'pwa_permanently_dismissed',
  LOGIN_TRIGGER: 'pwa_login_trigger'
};

/**
 * PWA Testing Utilities
 * Helper functions to test PWA installation flow
 */
export const PWATestHelpers = {
  
  // Simulate login trigger
  simulateLogin: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
      console.log('🧪 [PWATest] Login trigger simulated');
      return true;
    } catch (error) {
      console.error('❌ [PWATest] Error simulating login:', error);
      return false;
    }
  },

  // Reset all PWA state
  resetPWAState: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PWA_INSTALLED,
        STORAGE_KEYS.LAST_DISMISSED,
        STORAGE_KEYS.PERMANENTLY_DISMISSED,
        STORAGE_KEYS.LOGIN_TRIGGER
      ]);
      console.log('🧪 [PWATest] PWA state reset');
      
      // Also reload the page to reset in-memory state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
      return true;
    } catch (error) {
      console.error('❌ [PWATest] Error resetting PWA state:', error);
      return false;
    }
  },

  // Check current PWA state
  checkPWAState: async () => {
    try {
      const state = {
        installed: await AsyncStorage.getItem(STORAGE_KEYS.PWA_INSTALLED),
        lastDismissed: await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED),
        permanentlyDismissed: await AsyncStorage.getItem(STORAGE_KEYS.PERMANENTLY_DISMISSED),
        loginTrigger: await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER),
        isStandalone: typeof window !== 'undefined' ? (
          window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone ||
          document.referrer.includes('android-app://')
        ) : false
      };
      
      console.log('🧪 [PWATest] Current PWA state:', state);
      return state;
    } catch (error) {
      console.error('❌ [PWATest] Error checking PWA state:', error);
      return null;
    }
  },

  // Simulate permanent dismissal
  simulatePermanentDismissal: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
      console.log('🧪 [PWATest] Permanent dismissal simulated');
      return true;
    } catch (error) {
      console.error('❌ [PWATest] Error simulating permanent dismissal:', error);
      return false;
    }
  },

  // Simulate temporary dismissal (30-second cooldown)
  simulateTemporaryDismissal: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, Date.now().toString());
      console.log('🧪 [PWATest] Temporary dismissal simulated (30-second cooldown)');
      return true;
    } catch (error) {
      console.error('❌ [PWATest] Error simulating temporary dismissal:', error);
      return false;
    }
  },

  // Simulate PWA installation
  simulateInstallation: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      console.log('🧪 [PWATest] PWA installation simulated');
      return true;
    } catch (error) {
      console.error('❌ [PWATest] Error simulating installation:', error);
      return false;
    }
  },

  // Test cooldown period
  checkCooldown: async () => {
    try {
      const lastDismissed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
      if (!lastDismissed) {
        console.log('🧪 [PWATest] No cooldown active');
        return { active: false, remaining: 0 };
      }

      const timeSinceLastDismissed = Date.now() - parseInt(lastDismissed);
      const thirtySeconds = 30 * 1000;
      const remaining = Math.max(0, thirtySeconds - timeSinceLastDismissed);
      const active = remaining > 0;
      
      console.log(`🧪 [PWATest] Cooldown ${active ? 'active' : 'inactive'}, remaining: ${Math.ceil(remaining / 1000)} seconds (30-second cooldown)`);
      return { active, remaining: Math.ceil(remaining / 1000) };
    } catch (error) {
      console.error('❌ [PWATest] Error checking cooldown:', error);
      return { active: false, remaining: 0 };
    }
  },

  // Get platform info
  getPlatformInfo: () => {
    if (typeof navigator === 'undefined') return { platform: 'server', userAgent: 'N/A' };
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    
    let platform = 'web';
    if (isIOS) {
      platform = isSafari ? 'ios-safari' : 'ios-browser';
    } else if (isAndroid) {
      platform = isChrome ? 'android-chrome' : 'android-browser';
    }
    
    const info = {
      platform,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      userAgent: navigator.userAgent,
      standalone: window.navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    };
    
    console.log('🧪 [PWATest] Platform info:', info);
    return info;
  }
};

// Make helpers globally available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.PWATestHelpers = PWATestHelpers;
  
  console.log(`
🧪 PWA Test Helpers Available:
- PWATestHelpers.simulateLogin() - Trigger login to show prompt
- PWATestHelpers.resetPWAState() - Reset all PWA state and reload
- PWATestHelpers.checkPWAState() - Check current state
- PWATestHelpers.simulatePermanentDismissal() - Test permanent dismissal
- PWATestHelpers.simulateTemporaryDismissal() - Test 30-second cooldown
- PWATestHelpers.simulateInstallation() - Mark as installed
- PWATestHelpers.checkCooldown() - Check cooldown status (30 seconds)
- PWATestHelpers.getPlatformInfo() - Get platform detection info
  `);
}

export default PWATestHelpers;