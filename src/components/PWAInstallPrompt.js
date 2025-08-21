import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlatformDetection } from '../utils/PlatformDetection';

const PWAInstallPrompt = ({ visible, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const platform = PlatformDetection.getPlatformType();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Animate in
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
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
    onClose();
  };

  const AndroidInstallButton = () => (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="phone-portrait-outline" size={48} color="#0f60bd" />
      </View>
      <Text style={styles.title}>Install vasbazaar App</Text>
      <Text style={styles.description}>
        Get the full app experience with offline access and faster loading.
      </Text>
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="flash-outline" size={20} color="#28a745" />
          <Text style={styles.featureText}>Faster Loading</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="wifi-outline" size={20} color="#28a745" />
          <Text style={styles.featureText}>Works Offline</Text>
        </View>
      </View>
      {showInstallPrompt ? (
        <TouchableOpacity 
          style={styles.modernInstallButton} 
          onPress={handleInstallClick}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.modernInstallButtonText}>Install App</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noInstallText}>
          App installation is not available at the moment.
        </Text>
      )}
    </View>
  );

  const IOSInstallGuide = () => (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="phone-portrait-outline" size={48} color="#0f60bd" />
      </View>
      <Text style={styles.title}>Add vasbazaar to Home Screen</Text>
      <Text style={styles.description}>
        Install this app on your iPhone for a better experience:
      </Text>
      <View style={styles.modernStepContainer}>
        <View style={styles.modernStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Ionicons name="share-outline" size={24} color="#0f60bd" />
            <Text style={styles.modernStepText}>Tap the share button in Safari</Text>
          </View>
        </View>
        <View style={styles.modernStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Ionicons name="add-circle-outline" size={24} color="#0f60bd" />
            <Text style={styles.modernStepText}>Tap "Add to Home Screen"</Text>
          </View>
        </View>
        <View style={styles.modernStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#0f60bd" />
            <Text style={styles.modernStepText}>Tap "Add" to confirm</Text>
          </View>
        </View>
      </View>
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#6c757d" />
        <Text style={styles.modernNoteText}>
          The app will appear on your home screen like a native app!
        </Text>
      </View>
    </View>
  );

  const WebInstallPrompt = () => (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="desktop-outline" size={48} color="#0f60bd" />
      </View>
      <Text style={styles.title}>Install vasbazaar</Text>
      <Text style={styles.description}>
        Install this app for a better experience with offline access.
      </Text>
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="flash-outline" size={20} color="#28a745" />
          <Text style={styles.featureText}>Faster Loading</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="wifi-outline" size={20} color="#28a745" />
          <Text style={styles.featureText}>Works Offline</Text>
        </View>
      </View>
      {showInstallPrompt ? (
        <TouchableOpacity 
          style={styles.modernInstallButton} 
          onPress={handleInstallClick}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.modernInstallButtonText}>Install to add Home Screen</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.browserHintContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6c757d" />
          <Text style={styles.browserHintText}>
            Look for the install option in your browser's menu.
          </Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (platform) {
      case 'android':
        return <AndroidInstallButton />;
      case 'ios':
        return <IOSInstallGuide />;
      default:
        return <WebInstallPrompt />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.modernModal, 
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {renderContent()}
          <TouchableOpacity 
            style={styles.modernCloseButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.modernCloseButtonText}>Maybe Later</Text>
          </TouchableOpacity>
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
  },
  modernModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    maxWidth: 420,
    width: '100%',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f60bd',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 6,
  },
  modernInstallButton: {
    backgroundColor: '#0f60bd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 160,
    ...Platform.select({
      web: {
        shadowColor: '#0f60bd',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  modernInstallButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  modernStepContainer: {
    marginBottom: 20,
    width: '100%',
  },
  modernStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f60bd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStepText: {
    fontSize: 15,
    color: '#495057',
    marginLeft: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  modernNoteText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    fontStyle: 'italic',
    flex: 1,
  },
  browserHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  browserHintText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
  noInstallText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modernCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modernCloseButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PWAInstallPrompt;