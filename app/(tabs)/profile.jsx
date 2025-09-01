import { useState, useEffect , useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform,
  ScrollView,
  Keyboard,
  StatusBar,
  Dimensions 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';
import SimpleImageCropper from '@/components/SimpleImageCropper';
import ProfilePhotoViewer from '@/components/ProfilePhotoViewer';
import AndroidLayoutLock from '@/components/AndroidLayoutLock';
import { updateProfilePhoto } from '@/services/user/userService';
import { extendSession } from '@/services/auth/sessionManager';

// Using SimpleImageCropper - no external CSS dependencies

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isImagePickerActive, setIsImagePickerActive] = useState(false);

  // Monitor screen dimension changes on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setScreenData(window);
      });

      return () => subscription?.remove();
    }
  }, []);

  // Web-specific viewport stabilization
  useEffect(() => {
    if (Platform.OS === 'web') {
      const viewport = document?.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.content;
        
        return () => {
          viewport.content = originalContent;
        };
      }
    }
  }, []);

  // Clear messages after 4 seconds with stable timing
  useEffect(() => {
    let timer;
    if (successMessage || errorMessage) {
      timer = setTimeout(() => {
        // Use a more stable state update to prevent layout shifts
        if (successMessage) setSuccessMessage(null);
        if (errorMessage) setErrorMessage(null);
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successMessage, errorMessage]);

  // Helper functions for showing messages
  const showSuccess = (message) => {
    // Ensure no keyboard is active and dismiss any focus to prevent layout shifts
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
      // Add a small delay to ensure keyboard is fully dismissed before showing message
      setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(message);
      }, 100);
    } else {
      setErrorMessage(null);
      setSuccessMessage(message);
    }
  };

  const showError = (message) => {
    // Ensure no keyboard is active and dismiss any focus to prevent layout shifts
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
      // Add a small delay to ensure keyboard is fully dismissed before showing message
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(message);
      }, 100);
    } else {
      setSuccessMessage(null);
      setErrorMessage(message);
    }
  };

  // Load user data and profile photo
  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
  }, []);

  // Extend session when profile screen is focused
  useFocusEffect(
    useCallback(() => {
      extendSession();
    }, [])
  );

  const handleNotificationPress = () => {
    router.push('/main/NotificationScreen');
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    router.push('/main/AllServicesScreen');
  };

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const storedPhoto = await AsyncStorage.getItem('profile_photo');
      if (storedPhoto) {
        setProfilePhoto(storedPhoto);
      }
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  const handleProfilePhotoUpdate = async () => {
    console.log('handleProfilePhotoUpdate called, Platform:', Platform.OS);
    try {
      setUploading(true);
      // Clear any existing messages
      setSuccessMessage(null);
      setErrorMessage(null);

      // On Android, dismiss keyboard and stabilize UI completely
      if (Platform.OS === 'android') {
        Keyboard.dismiss();
        
        // Lock the current layout dimensions
        const currentDims = Dimensions.get('window');
        setScreenData(currentDims);
        
        // Create a system UI lock by temporarily disabling layout changes
        StatusBar.setHidden(false, 'none');
        
        // Short delay to ensure all system changes complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // For web browsers, especially iOS Chrome, use native file input
      if (Platform.OS === 'web') {
        // Create a file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // This helps with camera access on mobile browsers
        
        // Add styles to make it work better on iOS
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        
        return new Promise((resolve) => {
          input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
              try {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                  showError('Please select a valid image file');
                  return;
                }
                
                // Validate file size (5MB max)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                  showError('Image size should be less than 5MB');
                  return;
                }
                
                // Convert file to data URL for preview and upload
                const reader = new FileReader();
                reader.onload = (e) => {
                  const dataUrl = e.target.result;
                  console.log('File loaded as data URL');
                  
                  // Set the image for cropping
                  setSelectedImage(dataUrl);
                  setShowCropper(true);
                  resolve();
                };
                
                reader.onerror = () => {
                  showError('Failed to read the selected file');
                  resolve();
                };
                
                reader.readAsDataURL(file);
                
              } catch (error) {
                console.error('Error processing file:', error);
                showError('Failed to process the selected image');
                resolve();
              }
            }
            
            // Clean up
            document.body.removeChild(input);
          };
          
          input.oncancel = () => {
            document.body.removeChild(input);
            resolve();
          };
          
          // Trigger the file picker
          input.click();
        });
      }
      
      // For native platforms, use expo-image-picker
      console.log('Using expo-image-picker for native platform');
      let ImagePicker;
      
      try {
        // Use require instead of dynamic import to avoid module resolution issues
        ImagePicker = require('expo-image-picker');
        console.log('expo-image-picker imported successfully');
      } catch (importError) {
        console.error('Failed to import expo-image-picker:', importError);
        showError('Image picker is not available. Please ensure expo-image-picker is installed.');
        setUploading(false); // Reset uploading state
        return;
      }

      // Request permissions for native platforms
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showError('Please allow access to photos to upload your profile picture.');
        setUploading(false); // Reset uploading state
        return;
      }

      // Configure image picker options for native with better cropping
      const imagePickerOptions = {
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.default?.MediaTypeOptions?.Images || 'Images',
        allowsMultipleSelection: false,
        ...(Platform.OS === 'android' && {
          // Android: Critical settings to prevent UI displacement
          presentationStyle: 'overCurrentContext', // Don't go fullscreen
          allowsMultipleSelection: false,
          showsSelectedPlaybackRate: false,
          videoQuality: undefined,
          videoMaxDuration: undefined,
          // Force overlay mode to prevent system UI changes
          selectionLimit: 1,
        }),
        ...(Platform.OS !== 'android' && {
          presentationStyle: 'fullScreen',
        }),
      };
      console.log('ImagePicker MediaTypeOptions:', ImagePicker.MediaTypeOptions);

      // Android: Custom image picker launch with complete UI lock
      let result;
      if (Platform.OS === 'android') {
        console.log('Android: Activating layout lock and launching image picker');
        
        // Activate layout lock BEFORE opening picker
        setIsImagePickerActive(true);
        
        // Wait for layout lock to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          // Launch with absolute minimal UI disruption
          result = await ImagePicker.launchImageLibraryAsync({
            ...imagePickerOptions,
            presentationStyle: 'overCurrentContext',
            allowsEditing: false, // Completely disable editing
            quality: 0.7, // Lower quality for faster processing
          });
          
        } catch (error) {
          console.error('Android image picker error:', error);
          throw error;
        } finally {
          // Always deactivate layout lock after picker closes
          setIsImagePickerActive(false);
          
          // Force UI restoration
          await new Promise(resolve => setTimeout(resolve, 100));
          StatusBar.setHidden(false, 'none');
        }
      } else {
        // iOS/other platforms: Use normal image picker
        console.log('Launching image picker with options:', imagePickerOptions);
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      }
      console.log('Image picker result:', result);

      if (result.canceled) {
        console.log('Image picker was canceled');
        setUploading(false); // Reset uploading state
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        showError('No image selected');
        setUploading(false); // Reset uploading state
        return;
      }

      const image = result.assets[0];
      if (!image?.uri) {
        showError('Invalid image selected');
        setUploading(false); // Reset uploading state
        return;
      }

      // For native platforms, try to use expo-image-manipulator for better cropping
      let processedImage = image;
      
      try {
        // Use require instead of dynamic import to avoid module resolution issues
        const ImageManipulator = require('expo-image-manipulator');
        
        // Get image dimensions to calculate crop area for square crop
        const { width, height } = image;
        const size = Math.min(width, height);
        const x = (width - size) / 2;
        const y = (height - size) / 2;
        
        // Apply additional cropping/resizing if needed
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          image.uri,
          [
            { crop: { originX: x, originY: y, width: size, height: size } },
            { resize: { width: 300, height: 300 } }
          ],
          { 
            compress: 0.9, 
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false // Don't convert to base64 for mobile
          }
        );
        
        console.log('Image manipulated successfully');
        processedImage = manipulatedImage;
        
        // Update local state with processed image
        setProfilePhoto(manipulatedImage.uri);
        
      } catch (manipulatorError) {
        console.log('Image manipulator not available or failed, using original:', manipulatorError);
        // Update local state immediately for UI feedback on mobile
        setProfilePhoto(image.uri);
      }

      // Get session token for API call
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      console.log('Session token exists:', !!sessionToken);
      
      if (!sessionToken) {
        showError('Please login again to update your profile photo');
        return;
      }

      // Upload to server for native platforms
      // Always use the URI for mobile platforms to avoid blob creation issues
      const imageToUpload = processedImage.uri;
      console.log('Calling updateProfilePhoto with URI:', imageToUpload);
      const uploadResponse = await updateProfilePhoto(imageToUpload, sessionToken);
      console.log('Upload response received:', uploadResponse);
      
      if (uploadResponse.status === 'success') {
        // If server returns a photo URL, save that instead of local URI
        const photoToSave = uploadResponse.photoUrl || processedImage.uri;
        
        // Save to AsyncStorage on success
        await AsyncStorage.setItem('profile_photo', photoToSave);
        
        // Update state with server URL if available, using requestAnimationFrame to prevent layout thrashing
        if (uploadResponse.photoUrl) {
          requestAnimationFrame(() => {
            setProfilePhoto(uploadResponse.photoUrl);
          });
        }
        
        showSuccess(uploadResponse.message || 'Profile photo updated successfully!');
      } else {
        // Revert on failure
        await loadProfilePhoto();
        showError(uploadResponse.message || 'Failed to update profile photo');
      }

    } catch (error) {
      console.error('Photo upload error:', error);
      showError('Failed to update profile photo. Please try again.');
      // Reset to previous photo on error
      await loadProfilePhoto();
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (croppedImageBase64, croppedBlob) => {
    try {
      setShowCropper(false);
      setSelectedImage(null);
      setUploading(true);
      
      // Update local state immediately with base64 image for UI feedback
      setProfilePhoto(croppedImageBase64);
      console.log('Using base64 image for preview:', croppedImageBase64.substring(0, 50) + '...');

      // Get session token for API call
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      console.log('Session token exists:', !!sessionToken);
      
      if (!sessionToken) {
        showError('Please login again to update your profile photo');
        return;
      }

      // Upload to server using the service with base64 data
      console.log('Calling updateProfilePhoto with base64 data');
      const uploadResponse = await updateProfilePhoto(croppedImageBase64, sessionToken);
      console.log('Upload response received:', uploadResponse);
      
      if (uploadResponse.status === 'success') {
        let finalPhotoUrl = croppedImageBase64; // fallback to base64
        
        // Try to get server URL from various possible response formats
        if (uploadResponse.photoUrl) {
          finalPhotoUrl = uploadResponse.photoUrl;
          console.log('Got server photo URL:', finalPhotoUrl);
        } else if (uploadResponse.response?.data?.profile_photo) {
          finalPhotoUrl = uploadResponse.response.data.profile_photo;
          console.log('Got server photo URL from data:', finalPhotoUrl);
        } else if (uploadResponse.response?.profile_photo) {
          finalPhotoUrl = uploadResponse.response.profile_photo;
          console.log('Got server photo URL from response:', finalPhotoUrl);
        } else {
          console.log('Server did not return photo URL, using base64');
        }
        
        // Save the final photo (either server URL or base64) to AsyncStorage
        await AsyncStorage.setItem('profile_photo', finalPhotoUrl);
        // Use requestAnimationFrame to prevent layout thrashing
        requestAnimationFrame(() => {
          setProfilePhoto(finalPhotoUrl);
        });
        console.log('Saved photo to localStorage:', 
          finalPhotoUrl.startsWith('data:') ? 'base64 image data' : finalPhotoUrl);
        
        showSuccess(uploadResponse.message || 'Profile photo updated successfully!');
      } else {
        // Revert on failure
        await loadProfilePhoto();
        showError(uploadResponse.message || 'Failed to update profile photo');
      }

    } catch (error) {
      console.error('Photo upload error:', error);
      showError('Failed to update profile photo. Please try again.');
      // Reset to previous photo on error
      await loadProfilePhoto();
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
  };

  const removeProfilePhoto = () => {
    // Clear any existing messages before showing dialog
    setSuccessMessage(null);
    setErrorMessage(null);
    
    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('profile_photo');
              setProfilePhoto(null);
              showSuccess('Profile photo removed');
            } catch (error) {
              console.error('Error removing photo:', error);
            }
          },
        },
      ]
    );
  };

  const navigateToReferrals = () => {
    router.push('/main/ReferralListScreen');
  };

  const handleProfilePhotoPress = () => {
    if (profilePhoto) {
      setPhotoViewerVisible(true);
    } else {
      handleProfilePhotoUpdate();
    }
  };

  const handlePhotoViewerClose = () => {
    setPhotoViewerVisible(false);
  };

  // Use dynamic styles on Android, static styles elsewhere
  const currentStyles = Platform.OS === 'android' ? createStyles(screenData) : styles;

  return (
    <AndroidLayoutLock isActive={isImagePickerActive}>
      <View style={currentStyles.container}>
        {/* Android: Fixed header to prevent movement */}
        {Platform.OS === 'android' ? (
          <View style={currentStyles.androidHeader}>
            <Header 
              {...HeaderPresets.tabs}
              onNotificationPress={handleNotificationPress}
              onSearchPress={handleSearchPress}
            />
          </View>
        ) : (
          <View style={currentStyles.headerContainer}>
            <Header 
              {...HeaderPresets.tabs}
              onNotificationPress={handleNotificationPress}
              onSearchPress={handleSearchPress}
            />
          </View>
        )}

      <ScrollView 
        style={currentStyles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={currentStyles.scrollContent}
      >
        {/* Profile Photo Section */}
        <ThemedView style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={handleProfilePhotoPress}
            disabled={uploading}
          >
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.profileImage}
              />
            ) : (
              <ThemedView style={styles.placeholderImage}>
                <MaterialIcons name="person" size={60} color="#999" />
              </ThemedView>
            )}
            {uploading && (
              <ThemedView style={styles.uploadingOverlay}>
                <FontAwesome name="spinner" size={24} color="#fff" />
              </ThemedView>
            )}
          </TouchableOpacity>

          <ThemedView style={styles.photoActions}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handleProfilePhotoUpdate}
              disabled={uploading}
            >
              <FontAwesome name="camera" size={16} color="#000" />
              <ThemedText style={styles.buttonText}>
                {uploading ? 'Uploading...' : 'Change Photo'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* User Info Section */}
        <ThemedView style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          
          <ThemedView style={styles.infoGrid}>
            <ThemedView style={styles.infoCard}>
              <ThemedView style={styles.infoCardHeader}>
                <ThemedView style={styles.infoIconContainer}>
                  <FontAwesome name="user" size={20} color="#000000" />
                </ThemedView>
                <ThemedText style={styles.infoCardTitle}>Full Name</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoCardValue}>
                {userData?.name || 'Not available'}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoCard}>
              <ThemedView style={styles.infoCardHeader}>
                <ThemedView style={styles.infoIconContainer}>
                  <FontAwesome name="phone" size={20} color="#000000" />
                </ThemedView>
                <ThemedText style={styles.infoCardTitle}>Mobile Number</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoCardValue}>
                {userData?.mobile || 'Not available'}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoCard}>
              <ThemedView style={styles.infoCardHeader}>
                <ThemedView style={styles.infoIconContainer}>
                  <FontAwesome name="map-marker" size={20} color="#000000" />
                </ThemedView>
                <ThemedText style={styles.infoCardTitle}>Location</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoCardValue}>
                {userData?.city && userData?.state 
                  ? `${userData.city}, ${userData.state}`
                  : 'Not available'
                }
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoCard}>
              <ThemedView style={styles.infoCardHeader}>
                <ThemedView style={styles.infoIconContainer}>
                  <FontAwesome name="shield" size={20} color="#000000" />
                </ThemedView>
                <ThemedText style={styles.infoCardTitle}>Account Status</ThemedText>
              </ThemedView>
              <ThemedText style={[styles.infoCardValue, styles.verifiedStatus]}>
                {userData?.verified_status === 1 ? 'Verified' : 'Pending Verification'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Menu Section */}
        <ThemedView style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToReferrals}>
            <ThemedView style={styles.menuItemContent}>
              <ThemedView style={styles.menuIconBackground}>
                <FontAwesome name="users" size={20} color="#FFFFFF" />
              </ThemedView>
              <ThemedView style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Referral Users</ThemedText>
                <ThemedText style={styles.menuSubtitle}>View and manage your referred users</ThemedText>
              </ThemedView>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      
      {/* Image Cropper Modal for Web */}
      <SimpleImageCropper
        src={selectedImage}
        visible={showCropper}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      {/* Profile Photo Viewer */}
      <ProfilePhotoViewer
        visible={photoViewerVisible}
        onClose={handlePhotoViewerClose}
        imageUri={profilePhoto}
        userName={userData?.name}
      />

      {/* Success/Error Message Banner - Positioned absolutely to avoid layout shifts */}
      {successMessage && (
        <View style={[
          styles.successBanner, 
          { 
            top: Platform.OS === 'android' 
              ? 80  // Fixed position on Android
              : insets.top + (Platform.OS === 'ios' ? 90 : 70) + 10 
          }
        ]}>
          <FontAwesome name="check-circle" size={16} color="#FFFFFF" />
          <ThemedText style={styles.successText}>{successMessage}</ThemedText>
        </View>
      )}
      
      {errorMessage && (
        <View style={[
          styles.errorBanner, 
          { 
            top: Platform.OS === 'android' 
              ? 80  // Fixed position on Android
              : insets.top + (Platform.OS === 'ios' ? 90 : 70) + 10 
          }
        ]}>
          <FontAwesome name="exclamation-circle" size={16} color="#FFFFFF" />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      )}
      </View>
    </AndroidLayoutLock>
  );
}

// Create styles as a function to use dynamic screen dimensions
const createStyles = (screenData) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    ...(Platform.OS === 'android' && {
      // Android: Fixed dimensions to prevent viewport changes
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: screenData.height,
      width: screenData.width,
      overflow: 'hidden',
    }),
  },
  androidHeader: {
    // Android: Stable header that doesn't move
    height: 70,
    backgroundColor: '#ffffff',
    position: 'relative',
    zIndex: 1000,
    // Remove border - let the header component handle its own border
  },
  headerContainer: {
    // iOS/Web: Absolute positioned header
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    ...(Platform.OS === 'android' ? {
      // Android: No margin, container handles spacing
      marginTop: 0,
    } : {
      // iOS/Web: Margin for absolute header
      marginTop: Platform.OS === 'ios' ? 90 : 70,
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Account for tab bar
  },
  // Message Banners - Absolutely positioned to prevent layout shifts
  successBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 1000, // Very high z-index to appear above everything
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000, // Ensure it's above all other content
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 1000, // Very high z-index to appear above everything
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000, // Ensure it's above all other content
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 15,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#fff',
    borderColor: '#ff4444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  removeButtonText: {
    color: '#ff4444',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 15,
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 44,
  },
  verifiedStatus: {
    color: '#10B981',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
     backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
     backgroundColor: '#f8f9fa',
  },
  menuIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

// Default styles for non-Android platforms
const styles = createStyles(Dimensions.get('window'));