import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert, View } from 'react-native';
import { useStableLayout } from './StableLayoutProvider';

export const useStableImagePicker = () => {
  const { lockLayout, unlockLayout } = useStableLayout();

  // Enhanced image picker with layout stabilization
  const pickImageStable = async (options = {}) => {
    try {
      // Lock layout before opening picker
      lockLayout();

      const defaultOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Enhanced stability options
        allowsMultipleSelection: false,
        presentationStyle: Platform.OS === 'ios' 
          ? ImagePicker.UIImagePickerPresentationStyle.FullScreen 
          : 'fullscreen',
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select images.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch image picker with layout lock
      const result = await ImagePicker.launchImageLibraryAsync(finalOptions);
      
      return result;

    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    } finally {
      // Always unlock layout after picker closes
      setTimeout(() => {
        unlockLayout();
      }, Platform.OS === 'android' ? 500 : 200); // Android needs more time
    }
  };

  // Enhanced camera picker with layout stabilization
  const takePictureStable = async (options = {}) => {
    try {
      // Lock layout before opening camera
      lockLayout();

      const defaultOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Camera stability options
        presentationStyle: Platform.OS === 'ios' 
          ? ImagePicker.UIImagePickerPresentationStyle.FullScreen 
          : 'fullscreen',
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Request permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!cameraPermission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take photos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch camera with layout lock
      const result = await ImagePicker.launchCameraAsync(finalOptions);
      
      return result;

    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    } finally {
      // Always unlock layout after camera closes
      setTimeout(() => {
        unlockLayout();
      }, Platform.OS === 'android' ? 500 : 200);
    }
  };

  // Show image picker options with stable layout
  const showImagePickerOptions = (onImageSelected, customOptions = {}) => {
    const options = [
      { text: 'Camera', onPress: () => handleCameraPress(onImageSelected, customOptions) },
      { text: 'Photo Library', onPress: () => handleLibraryPress(onImageSelected, customOptions) },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Select Image', 'Choose an option', options);
  };

  const handleCameraPress = async (onImageSelected, options) => {
    const result = await takePictureStable(options);
    if (result && !result.canceled && result.assets?.[0]) {
      onImageSelected(result.assets[0]);
    }
  };

  const handleLibraryPress = async (onImageSelected, options) => {
    const result = await pickImageStable(options);
    if (result && !result.canceled && result.assets?.[0]) {
      onImageSelected(result.assets[0]);
    }
  };

  return {
    pickImageStable,
    takePictureStable,
    showImagePickerOptions,
  };
};

// Component wrapper for stable image picking
export const StableImagePickerProvider = ({ children }) => {
  const { isLocked } = useStableLayout();

  // Apply layout lock styles when active
  const containerStyle = isLocked ? {
    // Prevent any layout changes during image picker
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'android' && {
      // Android-specific stabilization
      flex: 1,
      height: '100%',
      width: '100%',
    }),
  } : undefined;

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};