import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  PWA_INSTALLED: 'pwa_installed',
  LAST_DISMISSED: 'pwa_last_dismissed',
  PERMANENTLY_DISMISSED: 'pwa_permanently_dismissed',
  LOGIN_TRIGGER: 'pwa_login_trigger'
};

/**
 * Hook to manage PWA installation state
 */
export function usePWAInstaller() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  // Check if PWA is installed
  const checkPWAInstalled = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') return false;

      // Check if running in standalone mode
      const isStandalone = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://')
      );

      if (isStandalone) {
        await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        setIsInstalled(true);
        return true;
      }

      // Check AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PWA_INSTALLED);
      const installed = stored === 'true';
      setIsInstalled(installed);
      return installed;
    } catch (error) {
      console.error('❌ [usePWAInstaller] Error checking PWA installation:', error);
      return false;
    }
  }, []);

  // Listen for install prompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 [usePWAInstaller] beforeinstallprompt event captured');
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = async () => {
      console.log('✅ [usePWAInstaller] PWA was installed');
      await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Initialize check
  useEffect(() => {
    checkPWAInstalled();
  }, [checkPWAInstalled]);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPromptEvent) {
      throw new Error('Install prompt not available');
    }

    try {
      const result = await installPromptEvent.prompt();
      console.log('📱 [usePWAInstaller] User response:', result.outcome);
      
      if (result.outcome === 'accepted') {
        await AsyncStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
        setIsInstalled(true);
        setInstallPromptEvent(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ [usePWAInstaller] Installation error:', error);
      throw error;
    }
  }, [installPromptEvent]);

  // Trigger login prompt
  const triggerLoginPrompt = useCallback(async () => {
    try {
      console.log('🔑 [usePWAInstaller] Setting login trigger');
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TRIGGER, 'true');
    } catch (error) {
      console.error('❌ [usePWAInstaller] Error setting login trigger:', error);
    }
  }, []);

  // Dismiss prompt temporarily (5 minutes)
  const dismissTemporarily = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_DISMISSED, Date.now().toString());
      console.log('📱 [usePWAInstaller] Prompt dismissed temporarily');
    } catch (error) {
      console.error('❌ [usePWAInstaller] Error dismissing temporarily:', error);
    }
  }, []);

  // Dismiss prompt permanently
  const dismissPermanently = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
      console.log('📱 [usePWAInstaller] Prompt dismissed permanently');
    } catch (error) {
      console.error('❌ [usePWAInstaller] Error dismissing permanently:', error);
    }
  }, []);

  return {
    isInstalled,
    installPromptEvent,
    canInstall: !!installPromptEvent && !isInstalled,
    installPWA,
    triggerLoginPrompt,
    dismissTemporarily,
    dismissPermanently,
    checkPWAInstalled,
    STORAGE_KEYS
  };
}

export default usePWAInstaller;