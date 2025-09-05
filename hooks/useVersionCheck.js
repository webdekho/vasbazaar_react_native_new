import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRequest } from '../services/api/baseApi';

const CURRENT_VERSION = '1.0.0';

/**
 * Simple hook for version checking and PWA installation
 */
export function useVersionCheck() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptData, setPromptData] = useState(null);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  const checkVersion = useCallback(async () => {
    try {
      console.log('🔄 [useVersionCheck] Checking version...');
      const response = await getRequest('api/dashboard/version');
      
      if (response?.status === 'success') {
        const latestVersion = response.data?.latestVersion;
        console.log(`🔍 [useVersionCheck] Current: ${CURRENT_VERSION}, Latest: ${latestVersion}`);
        
        if (latestVersion && compareVersions(CURRENT_VERSION, latestVersion) < 0) {
          const lastShown = await AsyncStorage.getItem('version_prompt_shown');
          
          if (lastShown !== latestVersion) {
            console.log('✅ [useVersionCheck] New version available, showing prompt');
            setPromptData({
              type: 'version',
              current: CURRENT_VERSION,
              latest: latestVersion,
              forceUpdate: response.data?.forceUpdate === 'true'
            });
            setShowPrompt(true);
            await AsyncStorage.setItem('version_prompt_shown', latestVersion);
          } else {
            console.log('⏭️ [useVersionCheck] Already shown this version');
          }
        } else {
          console.log('✅ [useVersionCheck] App is up to date');
        }
      }
    } catch (error) {
      console.error('❌ [useVersionCheck] Version check error:', error);
    }
  }, []);

  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    return 0;
  };

  const handleUpdate = () => {
    if (promptData?.forceUpdate) {
      window.location.reload();
    } else {
      window.location.reload();
    }
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  // Manual trigger for testing
  const forceShowVersionPrompt = (version = '2.0.0') => {
    setPromptData({
      type: 'version',
      current: CURRENT_VERSION,
      latest: version,
      forceUpdate: false
    });
    setShowPrompt(true);
  };

  return {
    showPrompt,
    promptData,
    handleUpdate,
    dismissPrompt,
    forceShowVersionPrompt,
    checkVersion
  };
}