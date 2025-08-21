import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlatformDetection } from '../utils/PlatformDetection';
import PWAInstallPrompt from './PWAInstallPrompt';

const InstallAppButton = ({ 
  style, 
  textStyle, 
  title = "Install App",
  showOnlyOnMobile = false,
  variant = "primary" // primary, secondary, outline
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Only show on web platform
    if (Platform.OS !== 'web') {
      setShouldShowButton(false);
      return;
    }

    // Always show button on web for debugging and testing
    setShouldShowButton(true);
    console.log('InstallAppButton: Component mounted on web platform');

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [showOnlyOnMobile]);

  const handleDirectInstall = async () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (deferredPrompt) {
      // Show the install prompt directly
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      setDeferredPrompt(null);
    } else {
      // Fallback to modal
      setShowPrompt(true);
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineButton;
      case 'secondary':
        return styles.secondaryButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      default:
        return styles.primaryText;
    }
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[styles.baseButton, getButtonStyle(), style]}
          onPress={handleDirectInstall}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons 
              name="download-outline" 
              size={18} 
              color={variant === 'outline' ? '#0f60bd' : '#ffffff'} 
              style={styles.buttonIcon}
            />
            <Text style={[styles.baseText, getTextStyle(), textStyle]}>
              {deferredPrompt ? title : `${title} (Guide)`}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <PWAInstallPrompt
        visible={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    ...Platform.select({
      web: {
        shadowColor: '#0f60bd',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 0,
      },
      default: {
        elevation: 4,
        shadowColor: '#0f60bd',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#0f60bd',
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f60bd',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#495057',
  },
  outlineText: {
    color: '#0f60bd',
  },
});

export default InstallAppButton;