import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import imageMap from './icons';

// Optimized header heights - reduced for better space utilization while maintaining usability
const HEADER_HEIGHT = Platform.select({
  ios: 44,      // iOS standard - maintained for consistency
  android: 50,  // Reduced from 56 to 50 (-6px) for better space efficiency
  web: 56,      // Reduced from 64 to 56 (-8px) for better space efficiency
  default: 44,
});

export default function CommonHeader({
  heading,
  goback = 'back',
  showLogo = false,
  logoKey = 'bharat_connect',
  whiteText = true,
  whiteHeader = false,
  headerStyle,
  titleStyle,
  showBackButton = true,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    if (goback === 'back') {
      navigation.goBack();
    } else {
      navigation.navigate(goback);
    }
  };

  const backgroundColor = whiteHeader ? '#ffffff' : '#000000';
  const textColor = whiteText ? '#ffffff' : '#000000';
  const iconColor = whiteText ? '#ffffff' : '#000000';

  return (
    <>
      {/* Status Bar */}
      <StatusBar 
        backgroundColor={backgroundColor}
        barStyle={whiteText ? "light-content" : "dark-content"}
        translucent={true}
      />
      
      {/* Status Bar Spacer for Android */}
      {Platform.OS === 'android' && (
        <View style={[styles.statusBarSpacer, { 
          backgroundColor,
          height: insets.top 
        }]} />
      )}
      
      {/* Header Container */}
      <View style={[
        styles.headerContainer,
        { backgroundColor },
        Platform.OS === 'ios' && { paddingTop: insets.top },
        headerStyle
      ]}>
        <View style={styles.headerContent}>
          {/* Left Section - Back Button */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity 
                onPress={handleGoBack} 
                style={styles.backButton}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={Platform.select({
                    ios: 22,
                    android: 22, // Reduced from 24 to 22
                    web: 22,     // Reduced from 24 to 22
                    default: 22,
                  })} 
                  color={iconColor} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Text 
              style={[
                styles.headerTitle, 
                { color: textColor },
                titleStyle
              ]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {heading}
            </Text>
          </View>

          {/* Right Section - Logo or Spacer */}
          <View style={styles.rightSection}>
            {showLogo && imageMap[logoKey] ? (
              <Image 
                source={imageMap[logoKey]} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarSpacer: {
    width: '100%',
  },
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.12)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: Platform.select({
      web: 20, // Slightly more padding for web
      default: 16,
    }),
  },
  leftSection: {
    width: Platform.select({
      web: 56,     // Slightly smaller for web
      android: 56, // Slightly smaller for android
      default: 60,
    }),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: Platform.select({
      web: 56,     // Slightly smaller for web
      android: 56, // Slightly smaller for android  
      default: 60,
    }),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    width: Platform.select({
      web: 36,     // Slightly smaller for web
      android: 36, // Slightly smaller for android  
      default: 40,
    }),
    height: Platform.select({
      web: 36,     // Slightly smaller for web
      android: 36, // Slightly smaller for android
      default: 40,
    }),
    borderRadius: Platform.select({
      web: 18,
      android: 18,
      default: 20,
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Platform.select({
      ios: 17,
      android: 18,
      default: 17,
    }),
    fontWeight: Platform.select({
      ios: '600',
      android: '500',
      default: '600',
    }),
    textAlign: 'center',
    maxWidth: '100%',
  },
  headerLogo: {
    width: Platform.select({
      web: 56,     // Slightly smaller for web
      android: 56, // Slightly smaller for android
      default: 60,
    }),
    height: Platform.select({
      web: 26,     // Slightly smaller for web
      android: 26, // Slightly smaller for android
      default: 28,
    }),
    maxWidth: Platform.select({
      web: 56,
      android: 56,
      default: 60,
    }),
  },
  logoPlaceholder: {
    width: Platform.select({
      web: 36,
      android: 36,
      default: 40,
    }),
    height: Platform.select({
      web: 26,
      android: 26,
      default: 28,
    }),
  },
});

// Default props
CommonHeader.defaultProps = {
  heading: '',
  goback: 'back',
  showLogo: false,
  logoKey: 'bharat_connect',
  whiteText: true,
  whiteHeader: false,
  showBackButton: true,
  headerStyle: {},
  titleStyle: {},
};