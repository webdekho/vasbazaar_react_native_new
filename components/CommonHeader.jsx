import React, { useCallback, useState, useEffect } from 'react';
import { 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Logo from '@/components/Logo';
import Sidebar from '@/components/Sidebar';

// Standard header heights as per platform guidelines
const HEADER_HEIGHT = Platform.select({
  ios: 44,
  android: 56,
  default: 56,
});

/**
 * Common application header component with customizable content and styling.
 * Supports back navigation, profile image display, search functionality, and notifications.
 */
export default function CommonHeader({ 
  title,
  showBackButton = false,
  onBackPress,
  headerStyle,
  titleStyle,
  leftComponent,
  rightComponent,
  centerComponent,
  showLogo = true,
  showSearch = true,
  showNotification = true,
  showMenu = true,
  onSearchPress,
  onNotificationPress,
  userInitial = 'U',
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const PROFILE_PHOTO_KEY = 'profile_photo';

  /**
   * Loads user profile photo from AsyncStorage
   */
  const loadProfilePhoto = useCallback(async () => {
    try {
      const storedPhotoUrl = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
      setProfilePhotoUrl(storedPhotoUrl);
    } catch (error) {
      setProfilePhotoUrl(null);
    }
  }, []);

  useEffect(() => {
    loadProfilePhoto();
  }, [loadProfilePhoto]);

  /**
   * Handles back button press with custom or default navigation
   */
  const handleBackPress = () => {
    try {
      if (onBackPress) {
        onBackPress();
      } else {
        router.back();
      }
    } catch (error) {
      // Fallback for navigation errors
    }
  };

  const handleMenuPress = () => {
    setSidebarVisible(true);
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/main/AllServicesScreen');
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/main/NotificationScreen');
    }
  };

  /**
   * Renders user profile image with error handling
   */
  const ProfileImage = () => {
    if (profilePhotoUrl) {
      return (
        <Image
          style={styles.profileImage}
          source={{ uri: profilePhotoUrl }}
          onError={() => setProfilePhotoUrl(null)}
        />
      );
    }

    return (
      <ThemedView style={styles.userAvatar}>
        <ThemedText style={styles.userAvatarText}>{userInitial}</ThemedText>
      </ThemedView>
    );
  };

  /**
   * Default left section component - shows either back button or profile/logo
   */
  const DefaultLeftComponent = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.headerButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#000" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.leftContainer}>
        {showMenu && (
          <TouchableOpacity 
            onPress={handleMenuPress}
            style={styles.profileButton}
          >
            <ProfileImage />
          </TouchableOpacity>
        )}
        {showLogo && (
          <Logo 
            size="medium"
            variant="default"
            source={require('@/assets/images/vasbazaar_logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        )}
      </View>
    );
  };

  /**
   * Default center section component - displays header title
   */
  const DefaultCenterComponent = () => {
    if (!title || showLogo) return null;
    
    return (
      <ThemedText style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
        {title}
      </ThemedText>
    );
  };

  /**
   * Default right section component - displays search and notification buttons
   */
  const DefaultRightComponent = () => (
    <View style={styles.rightContainer}>
      {showSearch && (
        <TouchableOpacity 
          onPress={handleSearchPress}
          style={styles.iconButton}
        >
          <FontAwesome name="search" size={16} color="white" />
        </TouchableOpacity>
      )}
      
      {showNotification && (
        <TouchableOpacity 
          onPress={handleNotificationPress}
          style={[styles.iconButton, styles.notificationButton]}
        >
          <FontAwesome name="bell" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      {/* Status Bar */}
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      {/* Header Container */}
      <ThemedView style={[
        styles.headerContainer,
        { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 20) : 0 },
        headerStyle
      ]}>
        <View style={styles.headerContent}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {leftComponent || <DefaultLeftComponent />}
          </View>

          {/* Center Section */}
          {!showLogo && (
            <View style={styles.centerSection}>
              {centerComponent || <DefaultCenterComponent />}
            </View>
          )}

          {/* Right Section */}
          <View style={styles.rightSection}>
            {rightComponent || <DefaultRightComponent />}
          </View>
        </View>
      </ThemedView>

      {/* Sidebar Component */}
      <Sidebar 
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B7280',
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
  logo: {
    height: 40,
    width: 160,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    maxWidth: '90%',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
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
});

// Header presets for common configurations
export const CommonHeaderPresets = {
  // Default tab screens header
  tabs: {
    showBackButton: false,
    showLogo: true,
    showSearch: true,
    showNotification: true,
    showMenu: true,
  },
  
  // Back navigation header
  back: {
    showBackButton: true,
    showLogo: false,
    showSearch: false,
    showNotification: false,
    showMenu: false,
  },
  
  // Title only header
  title: {
    showBackButton: true,
    showLogo: false,
    showSearch: false,
    showNotification: false,
    showMenu: false,
  },
  
  // Search enabled header
  search: {
    showBackButton: true,
    showLogo: false,
    showSearch: true,
    showNotification: false,
    showMenu: false,
  },
};