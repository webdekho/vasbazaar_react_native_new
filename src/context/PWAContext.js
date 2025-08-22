import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as serviceWorkerRegistration from '../utils/ServiceWorkerRegistration';
import VersionService from '../Services/VersionService';

const PWAContext = createContext();

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [appVersion, setAppVersion] = useState('1.0.1');

  useEffect(() => {
    // Only run PWA logic on web platform
    if (Platform.OS !== 'web') return;

    // Check online/offline status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Register service worker
    const registerSW = () => {
      serviceWorkerRegistration.register({
        onSuccess: (registration) => {
          console.log('PWA: Service worker registered successfully');
          setRegistration(registration);
        },
        onUpdate: (registration) => {
          console.log('PWA: Service worker update available');
          setUpdateAvailable(true);
          setRegistration(registration);
        }
      });
    };

    // Initialize version checking
    const initializeVersionCheck = () => {
      VersionService.onUpdateAvailable((latestVersion, updateInfo) => {
        console.log('PWA: Version update available:', latestVersion);
        setUpdateAvailable(true);
        setAppVersion(latestVersion);
      });
      
      // Start periodic version checks
      VersionService.startPeriodicCheck();
    };

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize
    updateOnlineStatus();
    registerSW();
    initializeVersionCheck();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      VersionService.stopPeriodicCheck();
    };
  }, []);

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } else {
      // Fallback to force reload
      VersionService.forceReload();
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      await registration.update();
    }
    // Also check for version updates via API
    await VersionService.checkForUpdates(true);
  };

  const value = {
    // State
    isOnline,
    updateAvailable,
    appVersion,
    isPWASupported: Platform.OS === 'web' && 'serviceWorker' in navigator,
    isMobile: serviceWorkerRegistration.isMobile(),
    
    // Actions
    updateApp,
    checkForUpdates
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
};

export default PWAContext;