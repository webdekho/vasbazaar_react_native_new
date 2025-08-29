import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, StatusBar, Platform, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Logo from '@/components/Logo';
import Sidebar from '@/components/Sidebar';
import ProfilePhotoViewer from '@/components/ProfilePhotoViewer';

export default function Header({ 
  title, 
  showBack = false, 
  showMenu = true, // Default to true for new design
  showSearch = true, // Default to true for new design
  showNotification = true, // Default to true for new design
  showLogo = true, // Default to true for new design
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  rightComponent,
  backgroundColor,
  textColor,
  style,
  userInitial = 'U',
  userImage = null // For future profile image support
}) {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setSidebarVisible(true);
    }
  };

  const handleAvatarPress = () => {
    // Always open sidebar immediately - this is the primary function
    setSidebarVisible(true);
  };

  const handleAvatarLongPress = () => {
    // Long press opens photo viewer if photo exists
    if (profilePhoto) {
      setPhotoViewerVisible(true);
    }
  };

  const handlePhotoViewerClose = () => {
    setPhotoViewerVisible(false);
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  // Load profile photo and user data from AsyncStorage
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

  useEffect(() => {
    loadProfilePhoto();
    loadUserData();
  }, []);

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/search');
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/main/NotificationScreen');
    }
  };

  const defaultBackgroundColor = backgroundColor || '#ffffff';

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={defaultBackgroundColor}
        translucent={false}
      />
      <ThemedView style={[
        styles.container, 
        { backgroundColor: defaultBackgroundColor },
        style
      ]}>
        {/* Left Section - User Avatar */}
        <ThemedView style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="arrow-left" size={20} color="#000000" />
            </TouchableOpacity>
          ) : showMenu && (
            <TouchableOpacity 
              style={styles.userIconButton} 
              onPress={handleAvatarPress}
              onLongPress={handleAvatarLongPress}
              delayLongPress={800}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {profilePhoto ? (
                <Image 
                  source={{ uri: profilePhoto }} 
                  style={styles.userAvatarImage}
                  onError={() => setProfilePhoto(null)}
                />
              ) : (
                <ThemedView style={styles.userAvatar}>
                  <ThemedText style={styles.userAvatarText}>{userInitial}</ThemedText>
                </ThemedView>
              )}
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Center-Left Section - VAS Bazaar Logo */}
        <ThemedView style={styles.centerSection}>
          {showLogo ? (
            <Logo 
              size="xlarge"
              variant="default"
              source={require('@/assets/images/vasbazaar_logo.png')}
              resizeMode="contain"
              style={styles.logoImage}
            />
          ) : title && (
            <ThemedText 
              style={[styles.title, { color: textColor || '#000000' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </ThemedText>
          )}
        </ThemedView>

        {/* Right Section - Search and Notification Icons */}
        <ThemedView style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity 
              style={styles.circularIconButton} 
              onPress={handleSearchPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="search" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          {showNotification && (
            <TouchableOpacity 
              style={[styles.circularIconButton, styles.notificationButton]} 
              onPress={handleNotificationPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="bell" size={16} color="#FFFFFF" />
              {/* Optional notification badge - make this dynamic based on props */}
            </TouchableOpacity>
          )}
          
          {rightComponent && rightComponent}
        </ThemedView>
      </ThemedView>

      {/* Sidebar Component */}
      <Sidebar 
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
      />

      {/* Profile Photo Viewer */}
      <ProfilePhotoViewer
        visible={photoViewerVisible}
        onClose={handlePhotoViewerClose}
        imageUri={profilePhoto}
        userName={userData?.name}
      />
    </>
  );
}

// Preset configurations for common header types
export const HeaderPresets = {
  // Default VAS Bazaar header with all elements (new design)
  default: {
    showMenu: true,
    showLogo: true,
    showSearch: true,
    showNotification: true
  },

  // Tab screens header with menu, logo, search and notifications
  tabs: {
    showMenu: true,
    showLogo: true,
    showSearch: true,
    showNotification: true
  },

  // Home screen header with new design
  home: {
    showMenu: true,
    showLogo: true,
    showSearch: true,
    showNotification: true
  },
  
  // Back navigation header
  back: {
    showBack: true,
    showLogo: false,
    showSearch: false,
    showNotification: false
  },
  
  // Search enabled header
  search: {
    showBack: true,
    showSearch: true,
    showLogo: false,
    showNotification: false
  },
  
  // Clean header with just title
  clean: {
    showBack: true,
    showLogo: false,
    showSearch: false,
    showNotification: false
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 35 : 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 60, // Fixed width for consistent spacing
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-start', // Align to left instead of center
    justifyContent: 'center',
    paddingLeft: 0, // Remove padding for better left alignment
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100, // Fixed width for two circular buttons
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconButton: {
    // No margin needed, positioning handled by parent
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B7280', // Professional gray color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: 160,
    height: 40,
    marginLeft: 0,
  },
  vasText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35', // Orange color for "vas"
    letterSpacing: -0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    marginHorizontal: 1,
  },
  bazaarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000', // Black color for "bazaar"
    letterSpacing: -0.5,
  },
  circularIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8, // Spacing between buttons
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  notificationButton: {
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'left',
    color: '#000000',
  },
});