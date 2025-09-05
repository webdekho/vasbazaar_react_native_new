import React from 'react';
import { ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../utils/responsive';

export default function SafeScrollView({ 
  children, 
  style, 
  contentContainerStyle,
  ...props 
}) {
  const insets = useSafeAreaInsets();
  
  // Calculate safe bottom padding
  const safeBottomPadding = Platform.select({
    ios: TAB_BAR_HEIGHT + Math.max(insets.bottom, 20),
    android: TAB_BAR_HEIGHT + 10,
    default: TAB_BAR_HEIGHT + 10,
  });
  
  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: safeBottomPadding },
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={Platform.OS !== 'web'}
      bounces={Platform.OS === 'ios'}
      overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    // Web-specific fixes
    ...(Platform.OS === 'web' && {
      height: '100%',
      overscrollBehavior: 'none',
    }),
  },
  contentContainer: {
    flexGrow: 1,
    // Ensure minimum content height on web
    ...(Platform.OS === 'web' && {
      minHeight: '100%',
    }),
  },
});