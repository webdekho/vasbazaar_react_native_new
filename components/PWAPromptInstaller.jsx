import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Linking
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { showAlert, setWebAlertCallback } from '../utils/webAlert';
import WebAlertModal from './WebAlertModal';

// Global install prompt capture - capture before React components mount
let globalInstallPrompt = null;

// Capture beforeinstallprompt globally
if (typeof window !== 'undefined') {
  console.log('🌐 [PWAInstaller] Setting up global beforeinstallprompt listener');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🌐 [PWAInstaller] Global beforeinstallprompt captured:', e);
    e.preventDefault();
    globalInstallPrompt = e;
    
    // Store in window for debugging
    window.globalInstallPrompt = e;
  });
  
  // Also listen for app installation
  window.addEventListener('appinstalled', () => {
    console.log('🌐 [PWAInstaller] Global app installed event');
    globalInstallPrompt = null;
    window.globalInstallPrompt = null;
  });
}

const STORAGE_KEYS = {
  PWA_INSTALLED: 'pwa_installed',
  LAST_DISMISSED: 'pwa_last_dismissed',
  PERMANENTLY_DISMISSED: 'pwa_permanently_dismissed',
  LOGIN_TRIGGER: 'pwa_login_trigger',
  INSTALLATION_ATTEMPTS: 'pwa_installation_attempts'
};

const APP_STORE_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.vasbazaar.app',
  ios: 'https://apps.apple.com/app/vasbazaar/id123456789' // Replace with actual App Store ID
};

const TAB_ROUTES = ['/(tabs)/home', '/(tabs)/history', '/(tabs)/profile', '/(tabs)/wallet', '/home', '/history', '/profile', '/wallet'];

/**
 * Forceful PWA Install Prompt Component for Android
 * Prioritizes PWA installation with persistent prompts
 */
export default function PWAPromptInstaller() {
  const [visible, setVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [platform, setPlatform] = useState('web');
  const [webAlert, setWebAlert] = useState(null);
  const [installationAttempts, setInstallationAttempts] = useState(0);
  const [forcefulMode, setForcefulMode] = useState(false);
  const pathname = usePathname();

  // Enhanced platform and browser detection
  const detectPlatform = useCallback(() => {
    if (typeof navigator === 'undefined') return 'web';
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome|crios/.test(userAgent) && !/(edg|opr|samsung)/.test(userAgent);
    const isSamsung = /samsungbrowser|samsung/.test(userAgent);
    const isFirefox = /firefox|fxios/.test(userAgent);
    const isOpera = /opr\/|opera/.test(userAgent);
    const isEdge = /edg\/|edge/.test(userAgent);
    const isMiui = /miuibrowser|xiaomi/.test(userAgent);
    const isUC = /ucbrowser|uc/.test(userAgent);
    const isVivo = /vivobrowser|vivo/.test(userAgent);
    const isOppo = /oppo|coloros/.test(userAgent);
    
    if (isIOS) {
      return isSafari ? 'ios-safari' : 'ios-browser';
    } else if (isAndroid) {
      if (isChrome) return 'android-chrome';
      if (isSamsung) return 'android-samsung';
      if (isFirefox) return 'android-firefox';
      if (isOpera) return 'android-opera';
      if (isEdge) return 'android-edge';
      if (isMiui) return 'android-miui';
      if (isUC) return 'android-uc';
      if (isVivo) return 'android-vivo';
      if (isOppo) return 'android-oppo';
      return 'android-browser';
    }
    
    return 'web';
  }, []);

  // Check if PWA is already installed
  const isPWAInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://');
    
    return isStandalone;
  }, []);

  // Check if user is on tab route
  const isOnTabRoute = useCallback(() => {
    return TAB_ROUTES.some(route => pathname === route || pathname.startsWith(route));
  }, [pathname]);

  // Load installation attempts from storage
  const loadInstallationAttempts = useCallback(async () => {
    try {
      const attempts = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLATION_ATTEMPTS);
      const count = attempts ? parseInt(attempts, 10) : 0;
      setInstallationAttempts(count);
      
      // Enable forceful mode for Android after 2+ dismissals
      if (platform.includes('android') && count >= 2) {
        setForcefulMode(true);
        console.log('🚨 [PWAInstaller] Forceful mode activated after', count, 'attempts');
      }
    } catch (error) {
      console.error('❌ [PWAInstaller] Error loading installation attempts:', error);
    }
  }, [platform]);

  // Initialize with global install prompt and listen for new events
  useEffect(() => {
    // Check if global prompt is available
    if (globalInstallPrompt && !installPromptEvent) {
      console.log('📱 [PWAInstaller] Using global install prompt');
      setInstallPromptEvent(globalInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 [PWAInstaller] New beforeinstallprompt event captured');
      e.preventDefault();
      globalInstallPrompt = e;
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = () => {
      console.log('✅ [PWAInstaller] PWA was installed');
      AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      setVisible(false);
      setInstallPromptEvent(null);
      globalInstallPrompt = null;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [installPromptEvent]);

  // Initialize platform detection and load attempts
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    console.log(`📱 [PWAInstaller] Detected platform: ${detectedPlatform}`);
    
    // Load installation attempts after platform is set
    setTimeout(() => {
      loadInstallationAttempts();
    }, 100);
  }, [detectPlatform, loadInstallationAttempts]);

  // Set up web alert callback
  useEffect(() => {
    if (Platform.OS === 'web') {
      setWebAlertCallback(setWebAlert);
    }
    return () => {
      if (Platform.OS === 'web') {
        setWebAlertCallback(null);
      }
    };
  }, []);

  // Check if should show prompt with Android-specific logic
  const shouldShowPrompt = useCallback(async () => {
    try {
      // Don't show if not on web platform
      if (Platform.OS !== 'web') {
        console.log('📱 [PWAInstaller] Not web platform, skipping');
        return false;
      }

      // Don't show if PWA is already installed
      if (isPWAInstalled()) {
        console.log('📱 [PWAInstaller] PWA already installed');
        await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        return false;
      }

      // Don't show if not on tab route
      if (!isOnTabRoute()) {
        console.log('📱 [PWAInstaller] Not on tab route');
        return false;
      }

      // Check if PWA was marked as installed
      const pwaInstalled = await AsyncStorage.getItem(STORAGE_KEYS.PWA_INSTALLED);
      if (pwaInstalled === 'true') {
        console.log('📱 [PWAInstaller] PWA marked as installed');
        return false;
      }

      // For Android: Ultra-aggressive showing logic for all browsers
      if (platform.includes('android')) {
        // Check if permanently dismissed (only after many attempts)
        const permanentlyDismissed = await AsyncStorage.getItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
        if (permanentlyDismissed === 'true' && installationAttempts < 8) {
          console.log('📱 [PWAInstaller] Android: Ignoring permanent dismissal, attempts:', installationAttempts);
          // Clear permanent dismissal if attempts are low
          await AsyncStorage.removeItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
        } else if (permanentlyDismissed === 'true' && installationAttempts >= 8) {
          console.log('📱 [PWAInstaller] Android: Respecting permanent dismissal after 8+ attempts');
          return false;
        }

        // For Android, show immediately on ANY visit after first login
        const loginTrigger = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER);
        const lastDismissed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
        
        // Show if login trigger OR if user dismissed before (aggressive re-showing)
        const hasLoginTrigger = loginTrigger === 'true';
        const wasPreviouslyDismissed = lastDismissed !== null;
        
        // For Android: Show on first visit OR if previously dismissed (very aggressive)
        if (!hasLoginTrigger && !wasPreviouslyDismissed) {
          console.log('📱 [PWAInstaller] Android: First time visitor - showing immediately');
          // Set login trigger for new visitors
          await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
          return true;
        }

        // For Android: Very short cooldown period (3 seconds in forceful, 5s otherwise)
        if (wasPreviouslyDismissed) {
          const timeSinceLastDismissed = Date.now() - parseInt(lastDismissed);
          const cooldownTime = forcefulMode ? 3 * 1000 : 5 * 1000; // Shorter cooldowns
          
          if (timeSinceLastDismissed < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - timeSinceLastDismissed) / 1000);
            console.log(`📱 [PWAInstaller] Android cooldown active, ${remainingTime} seconds remaining`);
            return false;
          }
          
          console.log('📱 [PWAInstaller] Android cooldown expired, showing prompt again');
        }

        console.log('✅ [PWAInstaller] Android conditions met, showing prompt');
        return true;
      } else {
        // For non-Android (iOS), use original logic
        const permanentlyDismissed = await AsyncStorage.getItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
        if (permanentlyDismissed === 'true') {
          console.log('📱 [PWAInstaller] iOS: Permanently dismissed');
          return false;
        }

        const loginTrigger = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER);
        const lastDismissed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
        
        const hasLoginTrigger = loginTrigger === 'true';
        const wasPreviouslyDismissed = lastDismissed !== null;
        
        if (!hasLoginTrigger && !wasPreviouslyDismissed) {
          console.log('📱 [PWAInstaller] iOS: No login trigger and never dismissed');
          return false;
        }

        // iOS: Standard 30-second cooldown
        if (wasPreviouslyDismissed) {
          const timeSinceLastDismissed = Date.now() - parseInt(lastDismissed);
          const thirtySeconds = 30 * 1000;
          
          if (timeSinceLastDismissed < thirtySeconds) {
            const remainingTime = Math.ceil((thirtySeconds - timeSinceLastDismissed) / 1000);
            console.log(`📱 [PWAInstaller] iOS cooldown active, ${remainingTime} seconds remaining`);
            return false;
          }
        }

        console.log('✅ [PWAInstaller] iOS conditions met, showing prompt');
        return true;
      }
    } catch (error) {
      console.error('❌ [PWAInstaller] Error checking conditions:', error);
      return false;
    }
  }, [isPWAInstalled, isOnTabRoute, platform, installationAttempts, forcefulMode]);

  // Check conditions with Android-specific intervals
  useEffect(() => {
    const checkAndShow = async () => {
      if (await shouldShowPrompt()) {
        setVisible(true);
      }
    };

    checkAndShow();
    
    const setupInterval = async () => {
      const loginTrigger = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER);
      const lastDismissed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
      
      // Android-specific intervals - more aggressive
      if (platform.includes('android')) {
        if (forcefulMode) {
          // In forceful mode, check every 3 seconds
          return setInterval(checkAndShow, 3000);
        } else if (loginTrigger === 'true' && !lastDismissed) {
          // Fresh login on Android, check every 500ms for instant response
          return setInterval(checkAndShow, 500);
        } else {
          // Android dismissed before, check every 5 seconds
          return setInterval(checkAndShow, 5000);
        }
      } else {
        // iOS: Use original intervals
        if (loginTrigger === 'true' && !lastDismissed) {
          return setInterval(checkAndShow, 2000);
        }
        return setInterval(checkAndShow, 30000);
      }
    };
    
    let interval;
    setupInterval().then(intervalId => {
      interval = intervalId;
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shouldShowPrompt, pathname, platform, forcefulMode]);

  // Forceful Android installation handler
  const handleForcefulAndroidInstall = async () => {
    try {
      console.log('🚨 [PWAInstaller] FORCEFUL Android installation attempt');
      
      // Try all available methods aggressively
      const promptToUse = installPromptEvent || globalInstallPrompt;
      
      if (promptToUse) {
        console.log('📱 [PWAInstaller] Using install prompt API forcefully');
        try {
          const result = await promptToUse.prompt();
          console.log('📱 [PWAInstaller] Forceful prompt result:', result.outcome);
          
          if (result.outcome === 'accepted') {
            console.log('✅ [PWAInstaller] Forceful installation accepted');
            await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
            await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
            setVisible(false);
            setInstallPromptEvent(null);
            globalInstallPrompt = null;
            return;
          } else {
            console.log('❌ [PWAInstaller] Forceful installation declined');
            // Don't give up easily on Android
            await handleAndroidPersistentPrompt();
            return;
          }
        } catch (error) {
          console.error('❌ [PWAInstaller] Forceful prompt error:', error);
          // Fall through to alternative methods
        }
      }

      // If no install prompt, try browser-specific methods
      await handleAndroidBrowserSpecificInstall();
      
    } catch (error) {
      console.error('❌ [PWAInstaller] Forceful Android install error:', error);
      await handleAndroidPersistentPrompt();
    }
  };

  // Android-specific persistent prompting
  const handleAndroidPersistentPrompt = async () => {
    const messages = [
      'vasbazaar works better as an app!\n\n📱 Tap your browser menu and select "Add to Home Screen" or "Install"',
      '🚀 Get the full vasbazaar experience!\n\nInstall now for:\n• Faster loading\n• Offline access\n• Push notifications',
      '⚡ Don\'t miss out on the app experience!\n\nTap the menu (⋮) and choose "Add to Home Screen"',
      '🎯 Almost there! Install vasbazaar as an app for the best experience.\n\nUse your browser menu to "Add to Home Screen"'
    ];
    
    const currentMessage = messages[Math.min(installationAttempts, messages.length - 1)];
    
    showAlert(
      'Install vasbazaar App',
      currentMessage,
      [
        { 
          text: 'Not Now', 
          style: 'cancel',
          onPress: async () => {
            // Shorter dismissal on Android
            await handleAndroidDismiss();
          }
        },
        { 
          text: 'Install Now', 
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
            await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
            setVisible(false);
          }
        }
      ]
    );
  };

  // Android browser-specific installation
  const handleAndroidBrowserSpecificInstall = async () => {
    const browserInstructions = {
      'android-chrome': 'Tap Chrome menu (⋮) → "Add to Home screen"',
      'android-samsung': 'Tap menu (⋮) → "Add page to" → "Home screen"', 
      'android-firefox': 'Tap menu (⋮) → "Install" or "Add to Home Screen"',
      'android-opera': 'Tap Opera menu → "Add to Home Screen"',
      'android-edge': 'Tap Edge menu (⋯) → "Apps" → "Install this site as an app"',
      'android-miui': 'Tap menu → "Add to Desktop" or "Add to Home Screen"',
      'android-uc': 'Tap UC menu → "Add to Home Screen"',
      'android-vivo': 'Tap menu → "Add to Home Screen"',
      'android-oppo': 'Tap menu → "Add to Home Screen"',
      'android-browser': 'Tap browser menu → "Add to Home Screen"'
    };
    
    const instruction = browserInstructions[platform] || browserInstructions['android-browser'];
    
    showAlert(
      '📱 Install vasbazaar',
      `Quick Installation:\n\n${instruction}\n\n✨ Get app-like experience with faster loading!`,
      [
        { 
          text: 'Skip',
          style: 'cancel',
          onPress: async () => await handleAndroidDismiss()
        },
        { 
          text: 'Installed', 
          onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
            await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
            setVisible(false);
          }
        }
      ]
    );
  };

  // Android-specific dismissal handling
  const handleAndroidDismiss = async () => {
    console.log('📱 [PWAInstaller] Android dismissal');
    
    // Increment attempts
    const newAttempts = installationAttempts + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.INSTALLATION_ATTEMPTS, newAttempts.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, Date.now().toString());
    setInstallationAttempts(newAttempts);
    
    // Enable forceful mode after 1 attempt on Android
    if (newAttempts >= 1 && platform.includes('android')) {
      setForcefulMode(true);
      console.log('🚨 [PWAInstaller] Forceful mode activated for Android');
    } else if (newAttempts >= 2) {
      setForcefulMode(true);
      console.log('🚨 [PWAInstaller] Forceful mode activated');
    }
    
    // Only allow permanent dismissal after 5+ attempts
    if (newAttempts >= 5) {
      showAlert(
        'One Last Try?',
        'We really think you\'ll love the app experience! Install vasbazaar for faster loading and better performance.\n\nThis is the last time we\'ll ask.',
        [
          { 
            text: 'Never Ask Again',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
              await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
              setVisible(false);
            }
          },
          { 
            text: 'Install Now',
            onPress: async () => {
              await handleForcefulAndroidInstall();
            }
          }
        ]
      );
      return;
    }
    
    setVisible(false);
  };

  // Universal installation handler
  const handleUniversalInstall = async () => {
    try {
      console.log(`📱 [PWAInstaller] Installation attempt for platform: ${platform}`);
      
      // For Android, use forceful installation
      if (platform.includes('android')) {
        return await handleForcefulAndroidInstall();
      }
      
      // For iOS, use standard method
      const promptToUse = installPromptEvent || globalInstallPrompt;
      
      if (promptToUse) {
        console.log('📱 [PWAInstaller] Using install prompt API');
        try {
          const result = await promptToUse.prompt();
          console.log('📱 [PWAInstaller] User response:', result.outcome);
          
          if (result.outcome === 'accepted') {
            console.log('✅ [PWAInstaller] PWA installation accepted');
            await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
            await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
            setVisible(false);
            setInstallPromptEvent(null);
            globalInstallPrompt = null;
            return;
          } else {
            console.log('❌ [PWAInstaller] User declined installation');
            await handleContinueOnWeb();
            return;
          }
        } catch (error) {
          console.error('❌ [PWAInstaller] Error with install prompt:', error);
        }
      }

      // Fallback for other platforms
      await handleGenericInstall();

    } catch (error) {
      console.error('❌ [PWAInstaller] Universal installation error:', error);
      showAlert('Installation Error', 'Could not install app. Please try using the browser menu to add to home screen.');
    }
  };

  // Handle app store redirect (only for iOS)
  const handleAppStoreRedirect = async () => {
    try {
      const storeLink = platform.includes('ios') ? APP_STORE_LINKS.ios : APP_STORE_LINKS.android;
      console.log(`📱 [PWAInstaller] Redirecting to store: ${storeLink}`);
      
      const supported = await Linking.canOpenURL(storeLink);
      if (supported) {
        await Linking.openURL(storeLink);
        await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
        setVisible(false);
      } else {
        showAlert('Error', 'Cannot open app store');
      }
    } catch (error) {
      console.error('❌ [PWAInstaller] Store redirect error:', error);
      showAlert('Error', 'Failed to open app store');
    }
  };

  // Handle continue on web
  const handleContinueOnWeb = async () => {
    console.log('📱 [PWAInstaller] User chose to continue on web');
    
    if (platform.includes('android')) {
      await handleAndroidDismiss();
    } else {
      // iOS: Standard dismissal
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, Date.now().toString());
      setVisible(false);
    }
  };

  // Handle permanent dismissal (more restrictive for Android)
  const handlePermanentDismissal = async () => {
    console.log('📱 [PWAInstaller] User permanently dismissed');
    
    if (platform.includes('android') && installationAttempts < 3) {
      // On Android, don't allow permanent dismissal too early
      showAlert(
        'Are you sure?',
        'The vasbazaar app provides a much better experience with faster loading and offline access. Try it once?',
        [
          { text: 'Try App', onPress: () => handleUniversalInstall() },
          { text: 'Not Now', onPress: () => handleAndroidDismiss() }
        ]
      );
      return;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
    setVisible(false);
  };

  // Generic installation fallback
  const handleGenericInstall = async () => {
    try {
      showAlert(
        'Add to Home Screen',
        'To install this app:\n1. Tap your browser menu (⋮ or ⋯)\n2. Look for "Add to Home Screen" or "Install"\n3. Tap "Add" to confirm',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Done', onPress: async () => {
            await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
            await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
            setVisible(false);
          }}
        ]
      );
    } catch (error) {
      console.error('❌ [PWAInstaller] Generic install error:', error);
      showAlert('Installation Help', 'Please use your browser menu to add this page to your home screen.');
    }
  };

  // Get platform-specific content with Android focus
  const getPlatformContent = () => {
    const isAndroid = platform.includes('android');
    
    if (isAndroid) {
      return {
        title: forcefulMode ? '🚀 Install vasbazaar Now!' : 'Install vasbazaar',
        subtitle: forcefulMode ? 'Get the premium app experience' : 'Add to your home screen for quick access',
        instructions: forcefulMode 
          ? '⚡ Faster • 📱 App-like • 🔔 Notifications • 💾 Offline access' 
          : 'Install as an app for the best experience',
        buttons: [
          { 
            text: forcefulMode ? 'INSTALL NOW' : 'Install App', 
            action: handleUniversalInstall, 
            icon: installPromptEvent ? 'install-mobile' : 'add-to-home-screen', 
            primary: true,
            urgent: forcefulMode
          }
        ]
      };
    } else if (platform === 'ios-safari') {
      return {
        title: 'Add to Home Screen',
        subtitle: 'Install vasbazaar for quick access',
        instructions: 'Get the app from App Store or add this page to your Home Screen',
        buttons: [
          { text: 'iPhone App', action: handleAppStoreRedirect, icon: 'store', primary: true },
          { text: 'Continue web', action: handleContinueOnWeb, icon: 'web', secondary: true }
        ]
      };
    } else if (platform === 'ios-browser') {
      return {
        title: 'Get vasbazaar App',
        subtitle: 'Better experience with the native app',
        instructions: 'Download from App Store for the best experience',
        buttons: [
          { text: 'iPhone App', action: handleAppStoreRedirect, icon: 'store', primary: true },
          { text: 'Continue web', action: handleContinueOnWeb, icon: 'web', secondary: true }
        ]
      };
    }
        
    return {
      title: 'Install vasbazaar',
      subtitle: 'Add to your device for quick access',
      instructions: installPromptEvent ? 'Install as an app for better performance' : 'Use the web version',
      buttons: installPromptEvent ? [
        { text: 'Install App', action: handleUniversalInstall, icon: 'install-mobile', primary: true }
      ] : []
    };
  };

  const content = getPlatformContent();

  if (!visible && !webAlert?.visible) return null;

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleContinueOnWeb}
    >
      <View style={[styles.overlay, forcefulMode && platform.includes('android') && styles.urgentOverlay]}>
        <View style={[styles.popup, forcefulMode && platform.includes('android') && styles.urgentPopup]}>
          {/* Close button - hidden in forceful mode for Android */}
          {!(forcefulMode && platform.includes('android')) && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleContinueOnWeb}
              accessibilityLabel="Close"
            >
              <MaterialIcons name="close" size={24} color="#888888" />
            </TouchableOpacity>
          )}

          {/* App icon with urgency indicator */}
          <View style={[styles.iconContainer, forcefulMode && styles.urgentIconContainer]}>
            {forcefulMode && platform.includes('android') && (
              <View style={styles.urgentBadge}>
                <MaterialIcons name="priority-high" size={20} color="#ffffff" />
              </View>
            )}
            <MaterialIcons 
              name="phone-android" 
              size={64} 
              color={forcefulMode && platform.includes('android') ? "#ff6b35" : "#000000"} 
            />
          </View>

          {/* Content */}
          <Text style={[
            styles.title, 
            forcefulMode && platform.includes('android') && styles.urgentTitle
          ]}>
            {content.title}
          </Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.instructions}>{content.instructions}</Text>

          {/* Android forceful mode benefits */}
          {forcefulMode && platform.includes('android') && (
            <View style={styles.benefitsList}>
              <Text style={styles.benefitsTitle}>Why install the app?</Text>
              <View style={styles.benefitsContainer}>
                <View style={styles.benefit}>
                  <MaterialIcons name="flash-on" size={16} color="#ff6b35" />
                  <Text style={styles.benefitText}>3x faster loading</Text>
                </View>
                <View style={styles.benefit}>
                  <MaterialIcons name="offline-bolt" size={16} color="#ff6b35" />
                  <Text style={styles.benefitText}>Works offline</Text>
                </View>
                <View style={styles.benefit}>
                  <MaterialIcons name="notifications-active" size={16} color="#ff6b35" />
                  <Text style={styles.benefitText}>Push notifications</Text>
                </View>
                <View style={styles.benefit}>
                  <MaterialIcons name="security" size={16} color="#ff6b35" />
                  <Text style={styles.benefitText}>More secure</Text>
                </View>
              </View>
            </View>
          )}

          {/* Special instructions for iOS Safari */}
          {platform === 'ios-safari' && (
            <View style={styles.safariInstructions}>
              <Text style={styles.instructionTitle}>How to add to Home Screen:</Text>
              <View style={styles.instructionStep}>
                <View style={styles.stepContent}>
                  <Text style={styles.instructionNumber}>1.</Text>
                  <Text style={styles.instructionText}>Tap the </Text>
                  <MaterialIcons name="ios-share" size={16} color="#007AFF" style={styles.inlineIcon} />
                  <Text style={styles.instructionText}> Share button at the bottom</Text>
                </View>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepContent}>
                  <Text style={styles.instructionNumber}>2.</Text>
                  <Text style={styles.instructionText}>Scroll down and tap </Text>
                  <MaterialIcons name="add-box" size={16} color="#007AFF" style={styles.inlineIcon} />
                  <Text style={styles.instructionText}> "Add to Home Screen"</Text>
                </View>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepContent}>
                  <Text style={styles.instructionNumber}>3.</Text>
                  <Text style={styles.instructionText}>Tap "Add" to confirm</Text>
                </View>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {content.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.primary && styles.primaryButton,
                  button.secondary && styles.secondaryButton,
                  button.urgent && styles.urgentButton,
                  content.buttons.length > 1 && styles.buttonFlex
                ]}
                onPress={button.action}
                accessibilityLabel={button.text}
              >
                <MaterialIcons 
                  name={button.icon} 
                  size={18} 
                  color={
                    button.urgent ? 'white' : 
                    button.primary ? 'white' : 
                    button.secondary ? '#666' : '#000000'
                  } 
                />
                <Text style={[
                  styles.buttonText,
                  button.primary && styles.primaryButtonText,
                  button.secondary && styles.secondaryButtonText,
                  button.urgent && styles.urgentButtonText
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Android-specific dismissal options */}
          {platform.includes('android') && (
            <View style={styles.androidDismissalContainer}>
              {!forcefulMode && (
                <TouchableOpacity 
                  style={styles.continueWeb}
                  onPress={handleContinueOnWeb}
                  accessibilityLabel="Continue web"
                >
                  <Text style={styles.continueWebText}>Continue web</Text>
                </TouchableOpacity>
              )}
              
              {forcefulMode && installationAttempts >= 3 && (
                <TouchableOpacity 
                  style={styles.finalDismiss}
                  onPress={handlePermanentDismissal}
                  accessibilityLabel="Never show again"
                >
                  <Text style={styles.finalDismissText}>Never show again</Text>
                </TouchableOpacity>
              )}
              
              {!forcefulMode && installationAttempts >= 2 && (
                <TouchableOpacity 
                  style={styles.dontShowAgain}
                  onPress={handlePermanentDismissal}
                  accessibilityLabel="Don't show again"
                >
                  <Text style={styles.dontShowAgainText}>Don't show again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* iOS standard dismissal */}
          {platform.includes('ios') && (
            <TouchableOpacity 
              style={styles.dontShowAgain}
              onPress={handleContinueOnWeb}
              accessibilityLabel="Continue web"
            >
              <Text style={styles.dontShowAgainText}>Continue web</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
    
    {/* Web Alert Modal */}
    {Platform.OS === 'web' && (
      <WebAlertModal 
        alert={webAlert} 
        onClose={() => setWebAlert(null)} 
      />
    )}
  </>
  );
}

// Public function to trigger PWA prompt after login
export const triggerPWAPromptAfterLogin = async () => {
  try {
    console.log('🔑 [PWAInstaller] ===== FUNCTION CALLED =====');
    console.log('🔑 [PWAInstaller] Setting login trigger to true');
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
    console.log('🔑 [PWAInstaller] Login trigger successfully set');
    
    // Verify it was set
    const verify = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER);
    console.log('🔑 [PWAInstaller] Verification - LOGIN_TRIGGER:', verify);
  } catch (error) {
    console.error('❌ [PWAInstaller] Error setting login trigger:', error);
  }
};

// Public function to check if PWA is installed
export const checkPWAInstalled = async () => {
  try {
    const installed = await AsyncStorage.getItem(STORAGE_KEYS.PWA_INSTALLED);
    return installed === 'true';
  } catch (error) {
    console.error('❌ [PWAInstaller] Error checking PWA installation:', error);
    return false;
  }
};

// Debug function to force show PWA prompt
export const debugShowPWAPrompt = async () => {
  try {
    console.log('🧪 [PWAInstaller] DEBUG - Force showing PWA prompt');
    
    // Force set login trigger
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
    console.log('🧪 [PWAInstaller] DEBUG - Login trigger force set');
    
    // Clear any dismissals
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_DISMISSED);
    await AsyncStorage.removeItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
    console.log('🧪 [PWAInstaller] DEBUG - Cleared dismissal flags');
    
    console.log('🧪 [PWAInstaller] DEBUG - Please wait 1-2 seconds for prompt to appear');
  } catch (error) {
    console.error('❌ [PWAInstaller] Debug function error:', error);
  }
};

// Debug function to enable forceful mode
export const debugEnableForcefulMode = async () => {
  try {
    console.log('🚨 [PWAInstaller] DEBUG - Enabling forceful mode');
    await AsyncStorage.setItem(STORAGE_KEYS.INSTALLATION_ATTEMPTS, '3');
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
    await AsyncStorage.removeItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
    console.log('🚨 [PWAInstaller] DEBUG - Forceful mode enabled, refresh page');
  } catch (error) {
    console.error('❌ [PWAInstaller] Debug forceful mode error:', error);
  }
};

// Reset all PWA settings function
export const resetAllPWASettings = async () => {
  try {
    console.log('🔄 [PWAInstaller] RESETTING ALL PWA SETTINGS');
    
    // Clear all PWA related storage
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PWA_INSTALLED,
      STORAGE_KEYS.LAST_DISMISSED, 
      STORAGE_KEYS.PERMANENTLY_DISMISSED,
      STORAGE_KEYS.LOGIN_TRIGGER,
      STORAGE_KEYS.INSTALLATION_ATTEMPTS
    ]);
    
    console.log('🔄 [PWAInstaller] All PWA settings cleared');
    console.log('🔄 [PWAInstaller] Fresh start - login again to trigger PWA prompt');
    
    // Also clear from localStorage if any
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('@PWA_LOGIN_TRIGGER');
      window.localStorage.removeItem('@PWA_LAST_DISMISSED');
      window.localStorage.removeItem('@PWA_PERMANENTLY_DISMISSED');
      window.localStorage.removeItem('@PWA_INSTALLED');
      window.localStorage.removeItem('@PWA_INSTALLATION_ATTEMPTS');
    }
    
    return true;
  } catch (error) {
    console.error('❌ [PWAInstaller] Error resetting PWA settings:', error);
    return false;
  }
};

// Debug function to check current install prompt state
export const checkInstallPromptState = () => {
  const state = {
    globalInstallPrompt: globalInstallPrompt ? 'Available' : 'Not Available',
    windowGlobalPrompt: typeof window !== 'undefined' && window.globalInstallPrompt ? 'Available' : 'Not Available',
    isStandalone: typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    manifestLink: typeof document !== 'undefined' ? !!document.querySelector('link[rel="manifest"]') : false
  };
  console.log('🔍 [PWAInstaller] Install Prompt State:', state);
  return state;
};

// Make debug functions globally available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugShowPWAPrompt = debugShowPWAPrompt;
  window.debugEnableForcefulMode = debugEnableForcefulMode;
  window.resetAllPWASettings = resetAllPWASettings;
  window.checkInstallPromptState = checkInstallPromptState;
  console.log('🧪 Debug functions available:');
  console.log('  - debugShowPWAPrompt() - Force show PWA prompt');
  console.log('  - debugEnableForcefulMode() - Enable forceful Android mode');
  console.log('  - resetAllPWASettings() - Reset all PWA settings');
  console.log('  - checkInstallPromptState() - Check install prompt state');
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  urgentOverlay: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  popup: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 400,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  urgentPopup: {
    borderTopColor: '#ff6b35',
    borderTopWidth: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
    marginTop: 8,
    position: 'relative',
  },
  urgentIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  urgentTitle: {
    color: '#ff6b35',
    fontSize: 26,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  benefitsList: {
    backgroundColor: '#fff8f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  safariInstructions: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  instructionStep: {
    marginBottom: 8,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    width: 20,
    marginRight: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
  },
  inlineIcon: {
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: 'transparent',
    gap: 8,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
  },
  urgentButton: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    transform: [{ scale: 1.02 }],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#666666',
  },
  urgentButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  androidDismissalContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  continueWeb: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  continueWebText: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
  finalDismiss: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  finalDismissText: {
    fontSize: 12,
    color: '#ff6b35',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  dontShowAgain: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dontShowAgainText: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});