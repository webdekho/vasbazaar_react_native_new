import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResponsiveLayout({ children, style }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, getResponsiveStyles(insets), style]}>
      {children}
    </View>
  );
}

const getResponsiveStyles = (insets) => {
  if (Platform.OS === 'web') {
    return {
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      // Handle safe areas on web
      paddingTop: insets.top || 0,
      paddingBottom: 0, // Let content handle bottom padding
      paddingLeft: insets.left || 0,
      paddingRight: insets.right || 0,
    };
  }
  
  return {
    flex: 1,
    // Mobile platforms handle safe areas differently
    ...(Platform.OS === 'ios' && {
      backgroundColor: '#ffffff',
    }),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
});

// Export a hook for getting responsive dimensions
export const useResponsiveDimensions = () => {
  const insets = useSafeAreaInsets();
  
  return {
    safeTop: insets.top,
    safeBottom: insets.bottom,
    safeLeft: insets.left,
    safeRight: insets.right,
    // Platform-specific adjustments
    headerTopPadding: Platform.select({
      ios: insets.top,
      android: 0,
      default: insets.top > 0 ? insets.top : 0, // Web with notch
    }),
    contentBottomPadding: Platform.select({
      ios: 60 + insets.bottom, // Tab bar + safe area
      android: 70, // Tab bar height
      default: 60, // Web tab bar height
    }),
  };
};