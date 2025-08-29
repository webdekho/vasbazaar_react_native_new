import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

const { width, height } = Dimensions.get('window');

const ProfilePhotoViewer = ({ visible, onClose, imageUri, userName }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleBackdropPress = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView style={styles.overlay}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerContent}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {userName || 'Profile Photo'}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="times" size={24} color="#ffffff" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Image Container */}
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <ThemedView style={styles.imageWrapper}>
            {imageUri && !imageError ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.profileImage}
                onLoad={handleImageLoad}
                onError={handleImageError}
                transition={200}
                placeholder={require('@/assets/images/avatar.jpg')}
                placeholderContentFit="cover"
                contentFit="cover"
              />
            ) : (
              <ThemedView style={styles.placeholderContainer}>
                <FontAwesome name="user" size={100} color="#999" />
                <ThemedText style={styles.placeholderText}>
                  {imageError ? 'Image not available' : 'No profile photo'}
                </ThemedText>
              </ThemedView>
            )}
            
            {imageLoading && imageUri && (
              <ThemedView style={styles.loadingOverlay}>
                <FontAwesome name="spinner" size={30} color="#ffffff" />
                <ThemedText style={styles.loadingText}>Loading...</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </TouchableOpacity>

        {/* Bottom Actions */}
        <ThemedView style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onClose}
          >
            <FontAwesome name="times" size={16} color="#ffffff" />
            <ThemedText style={styles.actionText}>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 80,
  },
  imageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: width - 40,
    maxHeight: height - 200,
  },
  profileImage: {
    width: Math.min(width - 40, height - 200),
    height: Math.min(width - 40, height - 200),
    borderRadius: Math.min(width - 40, height - 200) / 2,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  placeholderContainer: {
    width: Math.min(width - 40, height - 200, 300),
    height: Math.min(width - 40, height - 200, 300),
    borderRadius: Math.min(width - 40, height - 200, 300) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Math.min(width - 40, height - 200) / 2,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 10,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePhotoViewer;