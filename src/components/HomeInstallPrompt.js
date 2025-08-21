import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform,
  Animated,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformDetection } from '../utils/PlatformDetection';

const DISMISS_KEY = 'home_install_prompt_dismissed';
const DISMISS_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const HomeInstallPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [isInstalled, setIsInstalled] = useState(false);
  const platform = PlatformDetection.getPlatformType();

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') {
      return;
    }

    checkInstallStatus();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (visible) {
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
      } else {
        // Restore background scrolling when modal is closed
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
    }

    // Cleanup on unmount
    return () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
    };
  }, [visible]);

  const checkInstallStatus = async () => {
    try {
      // Check if PWA is installed
      if (typeof window !== 'undefined') {
        // Check for standalone mode (PWA installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        
        if (isStandalone) {
          setIsInstalled(true);
          return;
        }

        // Check for iOS PWA
        if (window.navigator.standalone === true) {
          setIsInstalled(true);
          return;
        }

        // Check dismissal status
        const dismissData = await AsyncStorage.getItem(DISMISS_KEY);
        if (dismissData) {
          const { timestamp } = JSON.parse(dismissData);
          const now = Date.now();
          const timeDiff = now - timestamp;
          
          // If less than 5 minutes, don't show
          if (timeDiff < DISMISS_DURATION) {
            // Set timer for remaining time
            const remainingTime = DISMISS_DURATION - timeDiff;
            setTimeout(() => {
              checkInstallStatus();
            }, remainingTime);
            return;
          }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setVisible(true);
          animateIn();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If no prompt event, but not installed, show prompt anyway
        setTimeout(() => {
          if (!isInstalled && !deferredPrompt) {
            setVisible(true);
            animateIn();
          }
        }, 2000);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }
    } catch (error) {
      console.error('Error checking install status:', error);
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      // Reset animation values for next time
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      if (callback) callback();
    });
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      animateOut();
    } else {
      // Fallback for browsers without prompt support
      alert('To install this app:\n1. Open your browser menu\n2. Look for "Install App" or "Add to Home Screen"\n3. Follow the prompts');
      animateOut();
    }
  };

  const handleAndroidApp = () => {
    // Redirect to Play Store
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.vasbazaar.app';
    
    animateOut(() => {
      if (Platform.OS === 'web') {
        window.open(playStoreUrl, '_blank');
      } else {
        Linking.openURL(playStoreUrl);
      }
    });
  };

  const handleMaybeLater = async () => {
    try {
      // Save dismissal timestamp
      await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
      
      animateOut();
      
      // Set timer to check again after 5 minutes
      setTimeout(() => {
        checkInstallStatus();
      }, DISMISS_DURATION);
    } catch (error) {
      console.error('Error saving dismissal:', error);
      animateOut();
    }
  };

  if (!visible || isInstalled || Platform.OS !== 'web') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleMaybeLater}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[styles.overlay, { opacity: fadeAnim }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleMaybeLater}
      >
        <Animated.View 
          style={[
            styles.modal, 
            { transform: [{ scale: scaleAnim }] }
          ]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(evt) => evt.stopPropagation()}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="download-outline" size={48} color="#0f60bd" />
          </View>

          {/* Title and Description */}
          <Text style={styles.title}>Install vasbazaar</Text>
          <Text style={styles.description}>
            Get the best experience with our app. Install it for quick access and offline features.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="flash" size={16} color="#28a745" />
              <Text style={styles.featureText}>Lightning Fast</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="wifi" size={16} color="#28a745" />
              <Text style={styles.featureText}>Works Offline</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="notifications" size={16} color="#28a745" />
              <Text style={styles.featureText}>Push Notifications</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.installButton]}
              onPress={handleInstall}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.installButtonText}>Install to add Home Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.androidButton]}
              onPress={handleAndroidApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google-playstore" size={20} color="#0f60bd" style={styles.buttonIcon} />
              <Text style={styles.androidButtonText}>Android App</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.laterButton]}
              onPress={handleMaybeLater}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      },
    }),
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#495057',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  installButton: {
    backgroundColor: '#000000',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  installButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  androidButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0f60bd',
  },
  androidButtonText: {
    fontSize: 16,
    color: '#0f60bd',
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: 'transparent',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default HomeInstallPrompt;