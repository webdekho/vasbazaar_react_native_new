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
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';

export default function ProfileScreen() {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  const updateProfilePhoto = async () => {
    try {
      setUploading(true);
      
      let ImagePicker;
      
      try {
        // Use require instead of dynamic import to avoid module resolution issues
        ImagePicker = require('expo-image-picker');
      } catch (importError) {
        Alert.alert(
          'Feature Unavailable', 
          'Image picker is not available. Please ensure expo-image-picker is installed.\n\nYou can manually update your profile photo by contacting support.'
        );
        return;
      }

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to photos to upload your profile picture.');
        return;
      }

      // Configure image picker options
      const imagePickerOptions = {
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'Images',
      };

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

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

      // For now, just save locally - you can implement server upload later
      await AsyncStorage.setItem('profile_photo', image.uri);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
      
      // TODO: Implement server upload here
      // await uploadToServer(image);

    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Upload Failed', 'Failed to update profile photo. Please try again.');
      // Reset to previous photo on error
      await loadProfilePhoto();
    } finally {
      setUploading(false);
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

          {/* Manual Photo Upload Option */}
          <TouchableOpacity style={styles.menuItem}>
            <ThemedView style={styles.menuItemContent}>
              <FontAwesome name="info-circle" size={20} color="#666" style={styles.menuIcon} />
              <ThemedView style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Photo Upload</ThemedText>
                <ThemedText style={styles.menuSubtitle}>
                  Having issues? Contact support for manual photo upload
                </ThemedText>
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