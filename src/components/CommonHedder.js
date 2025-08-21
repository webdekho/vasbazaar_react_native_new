import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { 
  Image, 
  Pressable, 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditional import for MaterialIcons
let MaterialIcons;
try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
} catch (error) {
  console.warn('MaterialIcons not available:', error);
  MaterialIcons = null;
}

// Standard header heights as per platform guidelines
const HEADER_HEIGHT = Platform.select({
  ios: 44,
  android: 56,
  default: 56,
});

const STATUS_BAR_HEIGHT = Platform.select({
  ios: 20, // Default for devices without notch
  android: 24,
  default: 24,
});

export default function CommonHeader({ 
  title,
  showBackButton = false,
  onBackPress,
  headerStyle,
  titleStyle,
  leftComponent,
  rightComponent,
  centerComponent,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  
  // Assets
  const profileIcon = require("../../assets/icons/profile.png");
  const bellIcon = require("../../assets/icons/bell.png");
  const logo = require('../../assets/vasbazaar_logo.png');
  
  const PROFILE_PHOTO_KEY = 'profile_photo';

  // Load profile photo
  const loadProfilePhoto = useCallback(async () => {
    try {
      const storedPhotoUrl = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
      setProfilePhotoUrl(storedPhotoUrl);
    } catch (error) {
      console.error('Error loading profile photo:', error);
      setProfilePhotoUrl(null);
    }
  }, []);

  // Reload profile photo when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfilePhoto();
    }, [loadProfilePhoto])
  );

  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Profile image component
  const ProfileImage = () => (
    <Image
      style={styles.profileImage}
      source={profilePhotoUrl ? { uri: profilePhotoUrl } : profileIcon}
      onError={() => setProfilePhotoUrl(null)}
      defaultSource={profileIcon}
    />
  );

  // Default left component (profile or back button)
  const DefaultLeftComponent = () => {
    if (showBackButton) {
      return (
        <Pressable 
          onPress={handleBackPress}
          style={styles.headerButton}
          android_ripple={{ color: '#e0e0e0', radius: 20 }}
        >
          {MaterialIcons ? (
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          ) : (
            <Text style={styles.backButtonText}>←</Text>
          )}
        </Pressable>
      );
    }

    return (
      <View style={styles.leftContainer}>
        <Pressable 
          onPress={() => navigation.openDrawer?.()}
          style={styles.profileButton}
          android_ripple={{ color: '#e0e0e0', radius: 20 }}
        >
          <ProfileImage />
        </Pressable>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
    );
  };

  // Default center component (title)
  const DefaultCenterComponent = () => {
    if (!title) return null;
    
    return (
      <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
        {title}
      </Text>
    );
  };

  // Default right component (search + notifications)
  const DefaultRightComponent = () => (
    <View style={styles.rightContainer}>
      <Pressable 
        onPress={() => navigation.navigate('AllServices')}
        style={styles.iconButton}
        android_ripple={{ color: '#ffffff30', radius: 18 }}
      >
        {MaterialIcons ? (
          <MaterialIcons name="search" size={20} color="white" />
        ) : (
          <Text style={styles.iconText}>🔍</Text>
        )}
      </Pressable>
      
      <Pressable 
        onPress={() => navigation.navigate('Notification')}
        style={styles.iconButton}
        android_ripple={{ color: '#ffffff30', radius: 18 }}
      >
        <Image source={bellIcon} style={styles.bellIcon} />
      </Pressable>
    </View>
  );

  return (
    <>
      {/* Status Bar */}
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />
      
      {/* Status Bar Spacer for Android */}
      {Platform.OS === 'android' && (
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      )}
      
      {/* Header Container */}
      <View style={[
        styles.headerContainer,
        Platform.OS === 'ios' && { paddingTop: 30 },
        headerStyle
      ]}>
        <View style={styles.headerContent}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {leftComponent || <DefaultLeftComponent />}
          </View>

          {/* Center Section */}
          <View style={styles.centerSection}>
            {centerComponent || <DefaultCenterComponent />}
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {rightComponent || <DefaultRightComponent />}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarSpacer: {
    backgroundColor: '#000000',
  },
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
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    height: 32,
    width: 200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    maxWidth: '90%',
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF', // iOS blue
    fontWeight: '400',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    color: 'white',
  },
  bellIcon: {
    width: 18,
    height: 18,
    tintColor: 'white',
  },
});

// PropTypes for better documentation (optional)
CommonHeader.defaultProps = {
  showBackButton: false,
  title: null,
  headerStyle: {},
  titleStyle: {},
  leftComponent: null,
  rightComponent: null,
  centerComponent: null,
  onBackPress: null,
};