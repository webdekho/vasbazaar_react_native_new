import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform,
  Animated,
  BackHandler 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VersionService from '../Services/VersionService';

const ForceUpdateModal = ({ visible, updateInfo, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [isUpdating, setIsUpdating] = useState(false);

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

      // Disable back button on Android for forced updates
      if (Platform.OS === 'android' && updateInfo?.isRequired) {
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          () => true // Prevent back button
        );

        return () => backHandler.remove();
      }
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, updateInfo?.isRequired]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if (Platform.OS === 'web') {
        // For PWA, force reload to get latest version
        VersionService.forceReload();
      } else {
        // For mobile, redirect to app store
        const updateUrl = updateInfo?.downloadUrl || 'https://play.google.com/store/apps/details?id=com.vasbazaar.app';
        
        if (Platform.OS === 'android') {
          // Android: Open Play Store
          window.open(updateUrl, '_blank');
        } else if (Platform.OS === 'ios') {
          // iOS: Open App Store
          const appStoreUrl = updateInfo?.iosDownloadUrl || 'https://apps.apple.com/app/vasbazaar/id123456789';
          window.open(appStoreUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleLater = () => {
    if (!updateInfo?.isRequired) {
      onClose();
    }
  };

  const getUpdateIcon = () => {
    if (updateInfo?.isRequired || updateInfo?.forceUpdate) {
      return 'warning';
    }
    return 'information-circle';
  };

  const getUpdateColor = () => {
    if (updateInfo?.isRequired || updateInfo?.forceUpdate) {
      return '#FF6B6B';
    }
    return '#4ECDC4';
  };

  if (!visible || !updateInfo) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={updateInfo?.isRequired ? undefined : onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.modal, 
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: getUpdateColor() + '20' }]}>
              <Ionicons 
                name={getUpdateIcon()} 
                size={32} 
                color={getUpdateColor()} 
              />
            </View>
            <Text style={styles.title}>
              {updateInfo.isRequired ? 'Update Required' : 'Update Available'}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              {updateInfo.updateMessage || 'A new version is available with important improvements and bug fixes.'}
            </Text>

            <View style={styles.versionInfo}>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>Current Version:</Text>
                <Text style={styles.versionValue}>{updateInfo.currentVersion}</Text>
              </View>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>Latest Version:</Text>
                <Text style={[styles.versionValue, styles.latestVersion]}>
                  {updateInfo.latestVersion}
                </Text>
              </View>
            </View>

            {updateInfo.isRequired && (
              <View style={styles.warningContainer}>
                <Ionicons name="shield-checkmark" size={16} color="#FF6B6B" />
                <Text style={styles.warningText}>
                  This update is required for security and stability.
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!updateInfo.isRequired && (
              <TouchableOpacity 
                style={styles.laterButton} 
                onPress={handleLater}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.updateButton,
                updateInfo.isRequired && styles.requiredUpdateButton
              ]}
              onPress={handleUpdate}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.updateButtonText}>Updating...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name="download-outline" 
                    size={18} 
                    color="#ffffff" 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.updateButtonText}>
                    {Platform.OS === 'web' ? 'Reload App' : 'Update Now'}
                  </Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  versionInfo: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
  },
  latestVersion: {
    color: '#0f60bd',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7d7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    fontSize: 14,
    color: '#c53030',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '600',
  },
  updateButton: {
    flex: 2,
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  requiredUpdateButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForceUpdateModal;