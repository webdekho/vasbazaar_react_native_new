import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Alert,
  Linking 
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRequest } from '../services/api/baseApi';

const CURRENT_VERSION = '1.0.0';

/**
 * Simple Version & Installation Prompt
 * Shows both version updates and PWA installation in one component
 */
export default function SimpleVersionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState(null); // 'version' or 'install'
  const [versionData, setVersionData] = useState(null);

  useEffect(() => {
    checkVersionAndPrompt();
    
    // Check every 30 minutes
    const interval = setInterval(checkVersionAndPrompt, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkVersionAndPrompt = async () => {
    try {
      console.log('🔍 [SimpleVersion] Checking version...');
      
      // 1. Check for version updates first
      const response = await getRequest('api/dashboard/version');
      
      if (response?.status === 'success') {
        const latestVersion = response.data?.latestVersion;
        
        if (latestVersion && compareVersions(CURRENT_VERSION, latestVersion) < 0) {
          console.log(`🆕 [SimpleVersion] New version available: ${latestVersion}`);
          
          // Check if we already showed this version
          const lastShown = await AsyncStorage.getItem('version_prompt_shown');
          if (lastShown !== latestVersion) {
            setVersionData({
              current: CURRENT_VERSION,
              latest: latestVersion,
              forceUpdate: response.data?.forceUpdate === 'true'
            });
            setPromptType('version');
            setShowPrompt(true);
            await AsyncStorage.setItem('version_prompt_shown', latestVersion);
            return;
          }
        }
      }
      
      // 2. If no version update, check for PWA installation prompt
      const installShown = await AsyncStorage.getItem('install_prompt_shown');
      const sessionCount = await AsyncStorage.getItem('pwa_session_count') || '0';
      
      if (!installShown || parseInt(sessionCount) % 10 === 0) {
        const alreadyInstalled = await AsyncStorage.getItem('pwa_shortcut_created');
        if (!alreadyInstalled) {
          console.log('📱 [SimpleVersion] Showing installation prompt');
          setPromptType('install');
          setShowPrompt(true);
          await AsyncStorage.setItem('install_prompt_shown', 'true');
        }
      }
      
    } catch (error) {
      console.error('❌ [SimpleVersion] Error:', error);
    }
  };

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

  const handleVersionUpdate = () => {
    if (versionData?.forceUpdate) {
      Alert.alert(
        'Update Required',
        'This update is required to continue using the app.',
        [{ text: 'Refresh Now', onPress: () => window.location.reload() }]
      );
    } else {
      Alert.alert(
        'Update Available',
        `Version ${versionData?.latest} is available. Would you like to update now?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update Now', onPress: () => window.location.reload() }
        ]
      );
    }
    setShowPrompt(false);
  };

  const handleInstallApp = async () => {
    const isIOS = Platform.OS === 'ios' || /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      Alert.alert(
        'Install vasbazaar',
        'To install this app:\n\n1. Tap the Share button (⬆️)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"',
        [{ text: 'Got it', onPress: () => setShowPrompt(false) }]
      );
    } else {
      // For Android/Desktop, try native installation
      if ('serviceWorker' in navigator) {
        Alert.alert(
          'Install vasbazaar',
          'Would you like to install this app for quick access?',
          [
            { text: 'Maybe Later', style: 'cancel', onPress: () => setShowPrompt(false) },
            { text: 'Install', onPress: installPWA }
          ]
        );
      }
    }
  };

  const installPWA = () => {
    // This would trigger browser's install prompt if available
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          AsyncStorage.setItem('pwa_shortcut_created', 'true');
        }
      });
    }
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {promptType === 'version' ? (
          <>
            <MaterialIcons name="system-update" size={48} color="#FF9800" />
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.message}>
              Version {versionData?.latest} is now available.{'\n'}
              Current version: {versionData?.current}
            </Text>
            
            <View style={styles.buttonContainer}>
              {!versionData?.forceUpdate && (
                <TouchableOpacity style={styles.dismissButton} onPress={dismissPrompt}>
                  <Text style={styles.dismissText}>Later</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={handleVersionUpdate}>
                <Text style={styles.actionText}>
                  {versionData?.forceUpdate ? 'Update Now' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <MaterialIcons name="get-app" size={48} color="#4CAF50" />
            <Text style={styles.title}>Install vasbazaar</Text>
            <Text style={styles.message}>
              Install this app on your device for faster access and better experience.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.dismissButton} onPress={dismissPrompt}>
                <Text style={styles.dismissText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleInstallApp}>
                <Text style={styles.actionText}>Install</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Export debug functions
if (typeof window !== 'undefined') {
  window.showVersionPrompt = () => {
    // This would be called from the component instance
    console.log('Use: import and add <SimpleVersionPrompt /> to your app');
  };
}