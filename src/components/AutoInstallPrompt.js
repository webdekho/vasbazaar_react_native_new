import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { PlatformDetection } from '../utils/PlatformDetection';
import { AuthContext } from '../context/AuthContext';

const AutoInstallPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const timeoutRef = useRef(null);
  const platform = PlatformDetection.getPlatformType();
  const { userToken, secureToken } = useContext(AuthContext);

  // Storage keys for tracking dismissals
  const STORAGE_KEYS = {
    dismissalData: 'autoInstallPrompt_dismissalData',
    sessionShown: 'autoInstallPromptShown'
  };

  // Helper functions for localStorage management
  const getDismissalData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.dismissalData);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          count: parsed.count || 0,
          lastDismissedAt: parsed.lastDismissedAt || null,
          sessionsCompleted: parsed.sessionsCompleted || 0
        };
      }
    } catch (e) {
      console.log('Error reading dismissal data from localStorage:', e);
    }
    return { count: 0, lastDismissedAt: null, sessionsCompleted: 0 };
  };

  const saveDismissalData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEYS.dismissalData, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving dismissal data to localStorage:', e);
    }
  };

  const incrementSessionCount = () => {
    const data = getDismissalData();
    data.sessionsCompleted += 1;
    saveDismissalData(data);
    console.log(`AutoInstallPrompt: Session count incremented to ${data.sessionsCompleted}`);
  };

  // Debug function for testing (available in window object)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugAutoInstallPrompt = {
        getDismissalData,
        clearDismissalData: () => {
          try {
            localStorage.removeItem(STORAGE_KEYS.dismissalData);
            console.log('Dismissal data cleared');
          } catch (e) {
            console.log('Error clearing dismissal data:', e);
          }
        },
        clearSessionData: () => {
          try {
            sessionStorage.removeItem(STORAGE_KEYS.sessionShown);
            console.log('Session data cleared');
          } catch (e) {
            console.log('Error clearing session data:', e);
          }
        },
        forceShow: () => {
          setVisible(true);
          console.log('Force showing prompt');
        }
      };
      
      return () => {
        delete window.debugAutoInstallPrompt;
      };
    }
  }, []);

  const checkIfShouldShow = useCallback(async () => {
    try {
      // Only show on web platform
      if (typeof window === 'undefined') {
        return;
      }

      // Check if already installed
      if (PlatformDetection.isInStandaloneMode()) {
        return;
      }

      // Only show for fully authenticated users (not during authentication flow)
      if (!userToken || !secureToken) {
        return;
      }

      // Increment session count for tracking (only once per session)
      try {
        const currentSessionShown = sessionStorage.getItem(STORAGE_KEYS.sessionShown);
        if (!currentSessionShown) {
          incrementSessionCount();
        }
      } catch (e) {
        console.log('Session storage not available for session tracking');
      }

      // Check if already shown this session
      if (hasShownThisSession) {
        console.log('AutoInstallPrompt: Already shown this session, skipping');
        return;
      }

      // Check session storage to prevent showing multiple times in same session
      try {
        const alreadyShown = sessionStorage.getItem(STORAGE_KEYS.sessionShown);
        if (alreadyShown === 'true') {
          console.log('AutoInstallPrompt: Already shown in this browser session, skipping');
          setHasShownThisSession(true);
          return;
        }
      } catch (e) {
        // Session storage not available, continue
        console.log('Session storage not available, continuing...');
      }

      // Check dismissal history and 10-session rule
      const dismissalData = getDismissalData();
      if (dismissalData.count > 0) {
        const sessionsSinceDismissal = dismissalData.sessionsCompleted;
        if (sessionsSinceDismissal < 10) {
          console.log(`AutoInstallPrompt: User dismissed prompt, waiting for 10 sessions. Current: ${sessionsSinceDismissal}/10`);
          return;
        } else {
          console.log('AutoInstallPrompt: 10 sessions completed since last dismissal, showing prompt again');
          // Reset the session counter since we're showing again
          const resetData = {
            ...dismissalData,
            sessionsCompleted: 0
          };
          saveDismissalData(resetData);
        }
      }

      // Mark as shown before displaying to prevent race conditions
      setHasShownThisSession(true);
      try {
        sessionStorage.setItem(STORAGE_KEYS.sessionShown, 'true');
      } catch (e) {
        console.log('Could not set session storage');
      }

      // Clear any existing timeout to prevent multiple prompts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Show the popup after authentication is complete
      // Delay showing the prompt by 2 seconds to let app load
      console.log('AutoInstallPrompt: Showing prompt for authenticated user');
      timeoutRef.current = setTimeout(() => {
        setVisible(true);
        timeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Error checking install prompt status:', error);
    }
  }, [userToken, secureToken, hasShownThisSession]);

  useEffect(() => {
    // Only check when both tokens are present (user is fully authenticated)
    if (userToken && secureToken) {
      checkIfShouldShow();
    }

    // Cleanup function to clear timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userToken, secureToken, checkIfShouldShow]);

  // Separate useEffect for PWA install prompt event
  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA install prompt available');
      e.preventDefault();
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

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleDirectInstall = async () => {
    if (platform === 'android' && deferredPrompt) {
      // Direct installation for Android
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the install prompt`);
        
        if (outcome === 'accepted') {
          setVisible(false);
          
          // Clear dismissal data since user installed the app
          try {
            localStorage.removeItem(STORAGE_KEYS.dismissalData);
            console.log('AutoInstallPrompt: App installed, clearing dismissal data');
          } catch (e) {
            console.log('Could not clear dismissal data after installation');
          }
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Install prompt error:', error);
        Alert.alert('Installation Error', 'Unable to install the app. Please try again later.');
      }
    } else {
      // For iOS or when deferredPrompt is not available, just close
      // The guided tour is already shown in the modal content
      console.log('Showing guided installation for', platform);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    
    // Record the dismissal in localStorage
    const dismissalData = getDismissalData();
    const updatedData = {
      count: dismissalData.count + 1,
      lastDismissedAt: new Date().toISOString(),
      sessionsCompleted: 0 // Reset session counter when user dismisses
    };
    saveDismissalData(updatedData);
    
    console.log(`AutoInstallPrompt: User dismissed prompt (total dismissals: ${updatedData.count}). Will show again after 10 more sessions.`);
  };

  const AndroidInstallContent = () => (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Install vasbazaar App</Text>
      <Text style={styles.description}>
        Get the full app experience with faster loading, offline access, and push notifications.
      </Text>
      {showInstallPrompt && deferredPrompt ? (
        <TouchableOpacity 
          style={styles.installButton} 
          onPress={handleDirectInstall}
        >
          <Text style={styles.installButtonText}>Install Now</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <Text style={styles.instructionText}>
            Look for the "Add to Home Screen" option in your browser menu
          </Text>
          <TouchableOpacity style={styles.installButton} onPress={handleDismiss}>
            <Text style={styles.installButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const IOSInstallContent = () => (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Add vasbazaar to Home Screen</Text>
      <Text style={styles.description}>
        Install this app on your iPhone for the best experience:
      </Text>
      <View style={styles.stepContainer}>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Tap the share button (□↑) in Safari</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Scroll down and tap "Add to Home Screen"</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Tap "Add" to confirm installation</Text>
        </View>
      </View>
      <Text style={styles.noteText}>
        The app will appear on your home screen like a native app! 🎉
      </Text>
    </View>
  );

  const WebInstallContent = () => (
    <View style={styles.container}>
      <Text style={styles.title}>💻 Install vasbazaar</Text>
      <Text style={styles.description}>
        Install this app for better performance and offline access.
      </Text>
      {showInstallPrompt && deferredPrompt ? (
        <TouchableOpacity 
          style={styles.installButton} 
          onPress={handleDirectInstall}
        >
          <Text style={styles.installButtonText}>Install App</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.instructionText}>
          Look for the install option in your browser's address bar or menu.
        </Text>
      )}
    </View>
  );

  const renderContent = () => {
    switch (platform) {
      case 'android':
        return <AndroidInstallContent />;
      case 'ios':
        return <IOSInstallContent />;
      default:
        return <WebInstallContent />;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {renderContent()}
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={handleDismiss}
          >
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 380,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f60bd',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  installButton: {
    backgroundColor: '#0f60bd',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    minWidth: 140,
  },
  installButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 20,
    width: '100%',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f60bd',
    backgroundColor: '#e6f3ff',
    width: 24,
    height: 24,
    textAlign: 'center',
    borderRadius: 12,
    marginRight: 12,
    lineHeight: 24,
  },
  stepText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
    lineHeight: 22,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AutoInstallPrompt;