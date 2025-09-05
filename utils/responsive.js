import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants for consistent spacing across the app - optimized for Material Icons and labels
export const TAB_BAR_HEIGHT = Platform.select({
  ios: 80,      // iOS tab bar height with Material Icons and labels
  android: 85,  // Android tab bar height with Material Icons and labels
  default: 85,  // Web tab bar height with Material Icons and labels
});

export const HEADER_HEIGHT = Platform.select({
  ios: 44,      // iOS standard navigation bar height
  android: 56,  // Android app bar height
  default: 56,  // Web header height
});

// Get dynamic dimensions
export const getWindowDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Get safe padding for content containers
export const useContentPadding = () => {
  const insets = useSafeAreaInsets();
  
  return {
    paddingTop: Math.max(insets.top, 0),
    paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10),
    paddingLeft: Math.max(insets.left, 0),
    paddingRight: Math.max(insets.right, 0),
  };
};

// Get safe scroll view content padding
export const useScrollContentPadding = (isLandscape = false) => {
  const insets = useSafeAreaInsets();
  
  // Adjust tab bar height based on orientation - optimized for Material Icons
  const tabBarHeight = Platform.select({
    ios: isLandscape ? 65 : 80,
    android: isLandscape ? 70 : 85,
    default: isLandscape ? 70 : 85,
  });
  
  // Calculate bottom padding to ensure content is visible above tab bar
  const bottomPadding = tabBarHeight + Math.max(insets.bottom, isLandscape ? 10 : 20) + 10;
  
  return {
    paddingBottom: bottomPadding,
  };
};

// Get header safe area padding
export const useHeaderPadding = () => {
  const insets = useSafeAreaInsets();
  
  // Only apply top padding on iOS and web with notch
  const shouldApplyTopPadding = Platform.OS === 'ios' || (Platform.OS === 'web' && insets.top > 0);
  
  return {
    paddingTop: shouldApplyTopPadding ? insets.top : 0,
    totalHeaderHeight: HEADER_HEIGHT + (shouldApplyTopPadding ? insets.top : 0),
  };
};

// Platform-specific styles helper
export const getPlatformStyles = (styles) => {
  const platformKey = Platform.OS;
  return {
    ...styles.common,
    ...styles[platformKey],
  };
};

// Responsive font sizes
export const getFontSize = (baseSize) => {
  const { width } = getWindowDimensions();
  const scale = width / 375; // iPhone 8 width as base
  const newSize = baseSize * Math.min(scale, 1.2); // Cap at 120% to prevent huge text
  return Math.round(newSize);
};

// Check if device has notch
export const hasNotch = () => {
  const insets = useSafeAreaInsets();
  return insets.top > 20;
};

// Get safe container styles
export const getSafeContainerStyle = () => {
  const insets = useSafeAreaInsets();
  
  return {
    flex: 1,
    backgroundColor: '#F8F9FA',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }),
  };
};

// Export commonly used responsive values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};