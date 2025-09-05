import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Modal
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRequest } from '../services/api/baseApi';

const CURRENT_VERSION = '1.0.6';

/**
 * Simple Version Update Popup
 * Shows when API returns a newer version or when controlled by props
 */
export default function VersionUpdatePopup({ 
  visible: controlledVisible, 
  onUpdate, 
  onDismiss, 
  currentVersion, 
  latestVersion, 
  forceUpdate 
}) {
  const [visible, setVisible] = useState(false);
  const [versionData, setVersionData] = useState(null);

  // Use controlled props if provided, otherwise use internal state
  const isVisible = controlledVisible !== undefined ? controlledVisible : visible;
  const currentData = currentVersion && latestVersion ? {
    current: currentVersion,
    latest: latestVersion,
    forceUpdate: forceUpdate
  } : versionData;

  useEffect(() => {
    // Only run internal checking if not controlled by props
    if (controlledVisible === undefined) {
      console.log('🔄 [VersionPopup] Starting internal version checking...');
      
      // Initial check after 3 seconds
      const initialTimer = setTimeout(() => {
        console.log('🔄 [VersionPopup] Initial version check after app load');
        checkForUpdates();
      }, 3000);
      
      // Check every 5 minutes (changed from 10 minutes)
      const interval = setInterval(() => {
        console.log('🔄 [VersionPopup] 5-minute periodic version check');
        checkForUpdates();
      }, 5 * 60 * 1000);
      
      return () => {
        console.log('🛑 [VersionPopup] Clearing version check timers');
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [controlledVisible]);

  const checkForUpdates = async () => {
    try {
      console.log('🔍 [VersionPopup] Checking for updates...');
      
      const response = await getRequest('api/dashboard/version');
      console.log('📦 [VersionPopup] API Response:', response);
      
      if (response?.status === 'success' && response.data?.latestVersion) {
        const latestVersion = response.data.latestVersion;
        const forceUpdate = response.data.forceUpdate === 'true';
        
        console.log(`🔍 [VersionPopup] Version check: ${CURRENT_VERSION} vs ${latestVersion}`);
        
        if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
          console.log(`🆕 [VersionPopup] New version available: ${latestVersion}`);
          
          // Check if we already showed this version today
          // const lastShownKey = `version_shown_${latestVersion}`;
          // const lastShown = await AsyncStorage.getItem(lastShownKey);
          // const today = new Date().toDateString();
          
          // if (lastShown !== today) {
            console.log('✅ [VersionPopup] Showing update popup');
            setVersionData({
              current: CURRENT_VERSION,
              latest: latestVersion,
              forceUpdate
            });
            setVisible(true);
          //   await AsyncStorage.setItem(lastShownKey, today);
          // } else {
          //   console.log('⏭️ [VersionPopup] Already shown today');
          // }
        } else {
          console.log('✅ [VersionPopup] App is up to date');
        }
      }
    } catch (error) {
      console.error('❌ [VersionPopup] Error checking version:', error);
    }
  };

  const isNewerVersion = (current, latest) => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    return false;
  };

  const handleUpdate = () => {
    console.log('🔄 [VersionPopup] User chose to update');
    
    if (onUpdate) {
      onUpdate(); // Use external handler if provided
    } else {
      setVisible(false);
      // Force refresh the page to get new version
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const handleDismiss = () => {
    console.log('❌ [VersionPopup] User dismissed update');
    
    if (onDismiss) {
      onDismiss(); // Use external handler if provided
    } else {
      setVisible(false);
    }
  };

  // Global function for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showVersionPopup = (version = '2.0.0') => {
        console.log(`🧪 [VersionPopup] Manually showing popup for version ${version}`);
        setVersionData({
          current: CURRENT_VERSION,
          latest: version,
          forceUpdate: false
        });
        setVisible(true);
      };
      
      window.forceVersionCheck = () => {
        console.log('🧪 [VersionPopup] Force checking version');
        checkForUpdates();
      };
    }
  }, []);

  if (!isVisible || !currentData) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={currentData.forceUpdate ? null : handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name="system-update" 
              size={56} 
              color={currentData.forceUpdate ? "#FF5722" : "#FF9800"} 
            />
          </View>
          
          <Text style={styles.title}>
            {currentData.forceUpdate ? 'Update Required' : 'Update Available'}
          </Text>
          
          <Text style={styles.message}>
            {currentData.forceUpdate 
              ? `Version ${currentData.latest} is required to continue using the app.`
              : `Version ${currentData.latest} is now available!\nCurrent: ${currentData.current}`
            }
          </Text>
          
          <View style={styles.buttonContainer}>
            {!currentData.forceUpdate && (
              <TouchableOpacity style={styles.laterButton} onPress={handleDismiss}>
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <MaterialIcons name="refresh" size={18} color="white" />
              <Text style={styles.updateText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  laterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  updateText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});