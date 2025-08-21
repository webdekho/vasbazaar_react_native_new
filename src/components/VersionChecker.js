import React, { useState, useEffect, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import VersionService from '../Services/VersionService';
import ForceUpdateModal from './ForceUpdateModal';

const VersionChecker = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Handle version update availability
  const handleUpdateAvailable = useCallback((latestVersion, updateInfo) => {
    setUpdateInfo(updateInfo);
    setShowUpdateModal(true);
    
    // Log update check result
    console.log('Update available:', {
      current: updateInfo.currentVersion,
      latest: latestVersion,
      required: updateInfo.isRequired
    });
  }, []);

  // Handle app state changes (check for updates when app becomes active)
  const handleAppStateChange = useCallback((nextAppState) => {
    if (nextAppState === 'active') {
      // Check for updates when app becomes active
      setTimeout(() => {
        VersionService.checkForUpdates();
      }, 2000); // 2 second delay to avoid interference with app startup
    }
  }, []);

  // Close update modal (only allowed for non-required updates)
  const handleCloseModal = useCallback(() => {
    if (!updateInfo?.isRequired) {
      setShowUpdateModal(false);
      setUpdateInfo(null);
    }
  }, [updateInfo?.isRequired]);

  // Force manual update check
  const checkForUpdates = useCallback(async () => {
    try {
      const result = await VersionService.checkForUpdates(true);
      if (!result) {
        console.log('No updates available');
      }
    } catch (error) {
      console.error('Manual update check failed:', error);
    }
  }, []);

  useEffect(() => {
    // Register update callback
    VersionService.onUpdateAvailable(handleUpdateAvailable);

    // Start periodic version checking
    VersionService.startPeriodicCheck();

    // Listen for app state changes (mobile platforms)
    let appStateSubscription;
    if (Platform.OS !== 'web') {
      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    }

    // Web-specific: Listen for page visibility changes
    let visibilityChangeHandler;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      visibilityChangeHandler = () => {
        if (!document.hidden) {
          // Page became visible, check for updates
          setTimeout(() => {
            VersionService.checkForUpdates();
          }, 1000);
        }
      };
      
      document.addEventListener('visibilitychange', visibilityChangeHandler);
    }

    // Web-specific: Listen for online/offline events
    let onlineHandler, offlineHandler;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onlineHandler = () => {
        // App came back online, check for updates
        setTimeout(() => {
          VersionService.checkForUpdates();
        }, 2000);
      };

      window.addEventListener('online', onlineHandler);
    }

    // Initial update check (delayed to avoid interfering with app startup)
    const initialCheckTimeout = setTimeout(() => {
      VersionService.checkForUpdates();
    }, 3000);

    // Cleanup function
    return () => {
      // Remove update callback
      VersionService.removeUpdateCallback(handleUpdateAvailable);
      
      // Stop periodic checking
      VersionService.stopPeriodicCheck();
      
      // Clean up event listeners
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
      
      if (visibilityChangeHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
      }
      
      if (onlineHandler && typeof window !== 'undefined') {
        window.removeEventListener('online', onlineHandler);
      }
      
      // Clear timeouts
      clearTimeout(initialCheckTimeout);
    };
  }, [handleUpdateAvailable, handleAppStateChange]);

  // Expose manual update check function globally for debugging
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.checkForUpdates = checkForUpdates;
    }
  }, [checkForUpdates]);

  return (
    <>
      {children}
      <ForceUpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default VersionChecker;