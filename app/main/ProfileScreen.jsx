import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';
import { updateProfilePhoto } from '../../services/user/userService';
import { BASE_URL } from '../../services/api/baseApi';

export default function ProfileScreen() {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [userData, setUserData] = useState(null);

  // Load user data and profile photo
  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
  }, []);

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

  // Helper function to correct image orientation using canvas
  const correctImageOrientation = (imageUri) => {
    return new Promise((resolve, reject) => {
      if (!imageUri.startsWith('data:')) {
        resolve(imageUri);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Clear and draw image correctly oriented
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert to data URI with proper quality
        const correctedDataUri = canvas.toDataURL('image/jpeg', 0.9);
        resolve(correctedDataUri);
      };

      img.onerror = () => {
        console.error('Failed to correct image orientation');
        resolve(imageUri); // Return original on error
      };

      img.src = imageUri;
    });
  };

  // Direct iOS Safari upload method to avoid service layer hanging
  const directUploadForSafari = async (imageUri, sessionToken) => {
    console.log('ProfileScreen: Using direct Safari upload method');
    
    try {
      // Apply orientation correction first
      console.log('ProfileScreen: Correcting image orientation...');
      const correctedImageUri = await correctImageOrientation(imageUri);
      
      // Create a simple FormData for direct upload
      const formData = new FormData();
      
      if (correctedImageUri.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(correctedImageUri);
        const blob = await response.blob();
        const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('photo', file);
        
        console.log('ProfileScreen: Created file from data URL:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
      } else {
        console.log('ProfileScreen: Invalid image URI format for Safari upload');
        throw new Error('Invalid image format for Safari upload');
      }
      
      // Direct fetch call with shorter timeout for Safari
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      console.log('ProfileScreen: Making direct API call to:', `${BASE_URL}/api/customer/user/updateProfile`);
      
      const response = await fetch(`${BASE_URL}/api/customer/user/updateProfile`, {
        method: 'PUT',
        headers: {
          'access_token': sessionToken,
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('ProfileScreen: Direct API response status:', response.status);
      
      const responseData = await response.json();
      console.log('ProfileScreen: Direct API response data:', responseData);
      
      if (response.ok && (responseData?.Status === 'SUCCESS' || responseData?.status === 'success')) {
        return {
          status: 'success',
          photoUrl: responseData.data?.profile_photo || responseData.profile_photo,
          message: 'Upload successful'
        };
      } else {
        throw new Error(responseData?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ProfileScreen: Direct Safari upload error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out - please try a smaller image');
      }
      throw error;
    }
  };

  // Alternative web-based photo picker for iOS Safari compatibility
  const updateProfilePhotoWeb = () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use camera if available
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve({ canceled: true });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            canceled: false,
            assets: [{
              uri: reader.result,
              width: 0,
              height: 0,
              type: 'image',
              fileName: file.name,
              fileSize: file.size
            }]
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      };
      
      input.oncancel = () => resolve({ canceled: true });
      input.click();
    });
  };

  const updateProfilePhoto = async () => {
    console.log('ProfileScreen: updateProfilePhoto called');
    console.log('ProfileScreen: Platform details:', {
      os: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'N/A'
    });
    
    try {
      console.log('ProfileScreen: Setting uploading to true');
      setUploading(true);
      setUploadStatus('Preparing upload...');

      // Request permissions (skip for web as it's handled differently)
      if (Platform.OS !== 'web') {
        setUploadStatus('Requesting permissions...');
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to photos to upload your profile picture.');
          return;
        }
      }

      // Configure image picker options with iOS web browser fixes
      const imagePickerOptions = {
        quality: Platform.OS === 'web' ? 0.9 : 0.8, // Higher quality for web to handle compression
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'Images',
        // Enable EXIF data preservation to handle orientation properly
        exif: true,
        ...(Platform.OS !== 'web' && {
          // Native app specific options
          allowsMultipleSelection: false,
          selectionLimit: 1,
        }),
        ...(Platform.OS === 'web' && {
          // Web-specific options for better iOS Safari compatibility
          base64: false, // Don't use base64 to avoid memory issues initially
        }),
      };

      // Launch image picker with iOS Safari fallback handling
      setUploadStatus('Opening photo selector...');
      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      } catch (pickerError) {
        console.error('Image picker error:', pickerError);
        
        // iOS Safari fallback - use native HTML5 file input
        if (Platform.OS === 'web') {
          console.log('Falling back to web file picker...');
          setUploadStatus('Using alternative file picker...');
          try {
            result = await updateProfilePhotoWeb();
          } catch (webError) {
            console.error('Web file picker error:', webError);
            Alert.alert('Error', 'Unable to access photo library. Please try again or use a different browser.');
            return;
          }
        } else {
          throw pickerError;
        }
      }

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No image selected');
        return;
      }

      const image = result.assets[0];
      if (!image?.uri) {
        Alert.alert('Error', 'Invalid image selected');
        return;
      }

      // Update local state immediately for UI feedback
      setProfilePhoto(image.uri);
      setUploadStatus('Processing image...');
      
      console.log('ProfileScreen: Starting upload process...');
      console.log('ProfileScreen: Image selected:', {
        uri: image.uri?.substring(0, 50) + '...',
        type: image.type,
        fileName: image.fileName,
        fileSize: image.fileSize
      });

      // Get user token
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        console.log('ProfileScreen: No session token found');
        Alert.alert('Error', 'Please log in again');
        router.replace('/auth/LoginScreen');
        return;
      }
      
      console.log('ProfileScreen: Session token found, proceeding with upload...');

      // Detect iOS Safari for special handling
      const isIOSSafari = Platform.OS === 'web' && 
                         navigator.userAgent.includes('Safari') && 
                         navigator.userAgent.includes('Mobile') &&
                         !navigator.userAgent.includes('Chrome');
      
      console.log('ProfileScreen: iOS Safari detected:', isIOSSafari);
      
      let uploadResult;
      
      if (isIOSSafari && image.uri.startsWith('data:')) {
        // Use direct upload method for iOS Safari to avoid service layer hanging
        console.log('ProfileScreen: Using direct Safari upload method...');
        setUploadStatus('Uploading (iOS Safari mode)...');
        uploadResult = await directUploadForSafari(image.uri, sessionToken);
      } else {
        // Use the existing updateProfilePhoto service with timeout for other browsers
        console.log('ProfileScreen: Using standard service upload method...');
        setUploadStatus('Uploading to server...');
        
        const uploadTimeout = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Upload timeout - this may be due to browser limitations'));
          }, 25000); // 25 second timeout
        });

        uploadResult = await Promise.race([
          updateProfilePhoto(image.uri, sessionToken),
          uploadTimeout
        ]);
      }
      
      console.log('ProfileScreen: Upload response:', uploadResult);

      if (uploadResult?.status === 'success') {
        console.log('ProfileScreen: Upload successful!');
        setUploadStatus('Saving photo...');
        // Save photo URL to AsyncStorage
        const photoUrl = uploadResult.photoUrl || image.uri;
        await AsyncStorage.setItem('profile_photo', photoUrl);
        setProfilePhoto(photoUrl);
        
        setUploadStatus('Upload complete!');
        setTimeout(() => setUploadStatus(''), 2000); // Clear status after 2 seconds
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        console.log('ProfileScreen: Upload failed:', uploadResult);
        throw new Error(uploadResult?.message || 'Upload failed');
      }

    } catch (error) {
      console.error('ProfileScreen: Upload error caught:', error);
      console.error('ProfileScreen: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Reset to previous photo on error
      await loadProfilePhoto();
      
      // Provide specific error messages for iOS web browser issues
      let errorMessage = error.message || 'Failed to update profile photo. Please try again.';
      
      if (Platform.OS === 'web') {
        // iOS Safari specific error handling
        if (errorMessage.includes('timeout')) {
          errorMessage = 'Upload timed out. iOS Safari may have limitations with large files. Please try a smaller image or use a different browser.';
        } else if (errorMessage.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMessage.includes('large')) {
          errorMessage = 'Image is too large. Please select a smaller image.';
        } else if (errorMessage.includes('format')) {
          errorMessage = 'Image format not supported. Please use JPG, PNG, or WebP.';
        } else if (errorMessage.includes('Failed to process')) {
          errorMessage = 'Unable to process image file. Please try a different image or browser.';
        }
      }
      
      console.log('ProfileScreen: Showing error to user:', errorMessage);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      console.log('ProfileScreen: Upload process completed, setting uploading to false');
      setUploading(false);
      if (uploadStatus && !uploadStatus.includes('complete')) {
        setUploadStatus('');
      }
    }
  };

  const removeProfilePhoto = () => {
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
              Alert.alert('Success', 'Profile photo removed');
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

  const navigateToSettings = () => {
    // Add settings screen navigation
    Alert.alert('Settings', 'Settings screen will be implemented');
  };

  return (
    <ThemedView style={styles.container}>
      <MainHeader 
        title="Profile"
        showBack={true}
        showSearch={false}
        showNotification={false}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <ThemedView style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={profilePhoto ? undefined : updateProfilePhoto}
            disabled={uploading}
          >
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.profileImage}
              />
            ) : (
              <ThemedView style={styles.placeholderImage}>
                <FontAwesome name="user" size={50} color="#999" />
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
              onPress={updateProfilePhoto}
              disabled={uploading}
            >
              <FontAwesome name="camera" size={16} color="#000" />
              <ThemedText style={styles.buttonText}>
                {uploading ? 'Uploading...' : 'Change Photo'}
              </ThemedText>
            </TouchableOpacity>
            
            {profilePhoto && !uploading && (
              <TouchableOpacity 
                style={[styles.photoButton, styles.removeButton]}
                onPress={removeProfilePhoto}
              >
                <FontAwesome name="trash" size={16} color="#ff4444" />
                <ThemedText style={[styles.buttonText, styles.removeButtonText]}>
                  Remove
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </ThemedView>

        {/* User Info Section */}
        <ThemedView style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          
          <ThemedView style={styles.infoItem}>
            <FontAwesome name="user" size={16} color="#666" style={styles.infoIcon} />
            <ThemedView style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Name</ThemedText>
              <ThemedText style={styles.infoValue}>
                {userData?.name || 'Not available'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <FontAwesome name="phone" size={16} color="#666" style={styles.infoIcon} />
            <ThemedView style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Mobile</ThemedText>
              <ThemedText style={styles.infoValue}>
                {userData?.mobile || 'Not available'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.infoItem}>
            <FontAwesome name="map-marker" size={16} color="#666" style={styles.infoIcon} />
            <ThemedView style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Location</ThemedText>
              <ThemedText style={styles.infoValue}>
                {userData?.city && userData?.state 
                  ? `${userData.city}, ${userData.state}`
                  : 'Not available'
                }
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Menu Section */}
        <ThemedView style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>Menu</ThemedText>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToReferrals}>
            <ThemedView style={styles.menuItemContent}>
              <FontAwesome name="users" size={20} color="#000" style={styles.menuIcon} />
              <ThemedView style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Referral Users</ThemedText>
                <ThemedText style={styles.menuSubtitle}>View your referred users</ThemedText>
              </ThemedView>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
            <ThemedView style={styles.menuItemContent}>
              <FontAwesome name="cog" size={20} color="#000" style={styles.menuIcon} />
              <ThemedView style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Settings</ThemedText>
                <ThemedText style={styles.menuSubtitle}>App preferences and settings</ThemedText>
              </ThemedView>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  infoIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
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
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
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