import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Linking,
  Alert
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';

const STORAGE_KEYS = {
  PWA_INSTALLED: 'pwa_installed',
  LAST_DISMISSED: 'pwa_last_dismissed',
  PERMANENTLY_DISMISSED: 'pwa_permanently_dismissed',
  LOGIN_TRIGGER: 'pwa_login_trigger'
};

const APP_STORE_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.vasbazaar.app',
  ios: 'https://apps.apple.com/app/vasbazaar/id123456789' // Replace with actual App Store ID
};

const TAB_ROUTES = ['/(tabs)/home', '/(tabs)/history', '/(tabs)/profile', '/(tabs)/wallet', '/home', '/history', '/profile', '/wallet'];

/**
 * PWA Install Prompt Component
 * Shows after successful login with platform-specific options
 */
export default function PWAPromptInstaller() {
  const [visible, setVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [platform, setPlatform] = useState('web');
  const pathname = usePathname();

  // Platform detection
  const detectPlatform = useCallback(() => {
    if (typeof navigator === 'undefined') return 'web';
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    
    if (isIOS) {
      return isSafari ? 'ios-safari' : 'ios-browser';
    } else if (isAndroid) {
      return isChrome ? 'android-chrome' : 'android-browser';
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

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 [PWAInstaller] beforeinstallprompt event captured');
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = () => {
      console.log('✅ [PWAInstaller] PWA was installed');
      AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      setVisible(false);
      setInstallPromptEvent(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  // Initialize platform detection
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    console.log(`📱 [PWAInstaller] Detected platform: ${detectedPlatform}`);
  }, [detectPlatform]);

  // Check if should show prompt
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

      // Check if permanently dismissed
      const permanentlyDismissed = await AsyncStorage.getItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
      if (permanentlyDismissed === 'true') {
        console.log('📱 [PWAInstaller] Permanently dismissed');
        return false;
      }

      // Check if PWA was marked as installed
      const pwaInstalled = await AsyncStorage.getItem(STORAGE_KEYS.PWA_INSTALLED);
      if (pwaInstalled === 'true') {
        console.log('📱 [PWAInstaller] PWA marked as installed');
        return false;
      }

      // Check if login trigger is set (user just logged in)
      const loginTrigger = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TRIGGER);
      if (loginTrigger !== 'true') {
        console.log('📱 [PWAInstaller] No login trigger');
        return false;
      }

      // Check 5-minute cooldown
      const lastDismissed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DISMISSED);
      if (lastDismissed) {
        const timeSinceLastDismissed = Date.now() - parseInt(lastDismissed);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceLastDismissed < fiveMinutes) {
          const remainingTime = Math.ceil((fiveMinutes - timeSinceLastDismissed) / 1000 / 60);
          console.log(`📱 [PWAInstaller] Cooldown active, ${remainingTime} minutes remaining`);
          return false;
        }
      }

      console.log('✅ [PWAInstaller] All conditions met, showing prompt');
      return true;
    } catch (error) {
      console.error('❌ [PWAInstaller] Error checking conditions:', error);
      return false;
    }
  }, [isPWAInstalled, isOnTabRoute]);

  // Check conditions periodically
  useEffect(() => {
    const checkAndShow = async () => {
      if (await shouldShowPrompt()) {
        setVisible(true);
        // Clear login trigger after showing
        await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TRIGGER);
      }
    };

    // Check immediately and then every 30 seconds
    checkAndShow();
    const interval = setInterval(checkAndShow, 30000);

    return () => clearInterval(interval);
  }, [shouldShowPrompt, pathname]);

  // Handle PWA installation
  const handleInstallPWA = async () => {
    try {
      console.log('📱 [PWAInstaller] Attempting PWA installation...');
      
      if (installPromptEvent) {
        const result = await installPromptEvent.prompt();
        console.log('📱 [PWAInstaller] User response:', result.outcome);
        
        if (result.outcome === 'accepted') {
          console.log('✅ [PWAInstaller] PWA installation accepted');
          await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
          setVisible(false);
        } else {
          console.log('❌ [PWAInstaller] PWA installation declined');
          await handleContinueOnWeb();
        }
        
        setInstallPromptEvent(null);
      } else {
        console.log('❌ [PWAInstaller] No install prompt available');
        Alert.alert(
          'Installation Not Available',
          'PWA installation is not supported on this browser. Try using Chrome or Edge.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ [PWAInstaller] Installation error:', error);
      Alert.alert('Installation Error', 'Failed to install the app. Please try again.');
    }
  };

  // Handle app store redirect
  const handleAppStoreRedirect = async () => {
    try {
      const storeLink = platform.includes('ios') ? APP_STORE_LINKS.ios : APP_STORE_LINKS.android;
      console.log(`📱 [PWAInstaller] Redirecting to store: ${storeLink}`);
      
      const supported = await Linking.canOpenURL(storeLink);
      if (supported) {
        await Linking.openURL(storeLink);
        await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        setVisible(false);
      } else {
        Alert.alert('Error', 'Cannot open app store');
      }
    } catch (error) {
      console.error('❌ [PWAInstaller] Store redirect error:', error);
      Alert.alert('Error', 'Failed to open app store');
    }
  };

  // Handle continue on web (5-minute cooldown)
  const handleContinueOnWeb = async () => {
    console.log('📱 [PWAInstaller] User chose to continue on web');
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, Date.now().toString());
    setVisible(false);
  };

  // Handle permanent dismissal
  const handlePermanentDismissal = async () => {
    console.log('📱 [PWAInstaller] User permanently dismissed');
    await AsyncStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
    setVisible(false);
  };

  // Get platform-specific content
  const getPlatformContent = () => {
    switch (platform) {
      case 'ios-safari':
        return {
          title: 'Add to Home Screen',
          subtitle: 'Install VasBazaar for quick access',
          instructions: 'Tap the Share button below and select "Add to Home Screen"',
          buttons: [
            { text: 'iOS App Store', action: handleAppStoreRedirect, icon: 'store', primary: true },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ]
        };
        
      case 'ios-browser':
        return {
          title: 'Get VasBazaar App',
          subtitle: 'Better experience with the native app',
          instructions: 'Download from App Store for the best experience',
          buttons: [
            { text: 'iOS App Store', action: handleAppStoreRedirect, icon: 'store', primary: true },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ]
        };
        
      case 'android-chrome':
        return {
          title: 'Install VasBazaar',
          subtitle: 'Add to your home screen for quick access',
          instructions: installPromptEvent ? 'Install as an app for faster access and offline support' : 'Get the app from Play Store',
          buttons: installPromptEvent ? [
            { text: 'Install App', action: handleInstallPWA, icon: 'install-mobile', primary: true },
            { text: 'Play Store', action: handleAppStoreRedirect, icon: 'store', secondary: false },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ] : [
            { text: 'Play Store', action: handleAppStoreRedirect, icon: 'store', primary: true },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ]
        };
        
      case 'android-browser':
        return {
          title: 'Get VasBazaar App',
          subtitle: 'Download from Play Store',
          instructions: 'For the best experience, download the official app',
          buttons: [
            { text: 'Play Store', action: handleAppStoreRedirect, icon: 'store', primary: true },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ]
        };
        
      default:
        return {
          title: 'Install VasBazaar',
          subtitle: 'Add to your device for quick access',
          instructions: installPromptEvent ? 'Install as an app for better performance' : 'Use the web version',
          buttons: installPromptEvent ? [
            { text: 'Install App', action: handleInstallPWA, icon: 'install-mobile', primary: true },
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', secondary: true }
          ] : [
            { text: 'Continue on Web', action: handleContinueOnWeb, icon: 'web', primary: true }
          ]
        };
    }
  };

  const content = getPlatformContent();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleContinueOnWeb}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleContinueOnWeb}
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* App icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="phone-android" size={64} color="#4CAF50" />
          </View>

          {/* Content */}
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.instructions}>{content.instructions}</Text>

          {/* Special instructions for iOS Safari */}
          {platform === 'ios-safari' && (
            <View style={styles.safariInstructions}>
              <View style={styles.instructionStep}>
                <MaterialIcons name="share" size={20} color="#007AFF" />
                <Text style={styles.instructionText}>1. Tap the Share button</Text>
              </View>
              <View style={styles.instructionStep}>
                <MaterialIcons name="add-to-home-screen" size={20} color="#007AFF" />
                <Text style={styles.instructionText}>2. Select "Add to Home Screen"</Text>
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
                  button.secondary && styles.secondaryButton
                ]}
                onPress={button.action}
                accessibilityLabel={button.text}
              >
                <MaterialIcons 
                  name={button.icon} 
                  size={18} 
                  color={button.primary ? 'white' : button.secondary ? '#666' : '#4CAF50'} 
                />
                <Text style={[
                  styles.buttonText,
                  button.primary && styles.primaryButtonText,
                  button.secondary && styles.secondaryButtonText
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Don't show again option */}
          <TouchableOpacity 
            style={styles.dontShowAgain}
            onPress={handlePermanentDismissal}
            accessibilityLabel="Don't show this again"
          >
            <Text style={styles.dontShowAgainText}>Don't show this again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Public function to trigger PWA prompt after login
export const triggerPWAPromptAfterLogin = async () => {
  try {
    console.log('🔑 [PWAInstaller] Login trigger set');
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
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
  safariInstructions: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#666',
  },
  dontShowAgain: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dontShowAgainText: {
    fontSize: 14,
    color: '#999',
    textDecoration: 'underline',
  },
});