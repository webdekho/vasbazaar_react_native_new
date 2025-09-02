import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useStableLayout } from './StableLayoutProvider';

export default function StableHeader({ 
  title = 'Screen Title',
  showBack = true,
  showSearch = false,
  showNotification = false,
  onBackPress,
  onSearchPress,
  onNotificationPress,
  rightComponent,
  backgroundColor = '#000000',
  textColor = '#FFFFFF'
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { statusBarHeight } = useStableLayout();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.log('Back navigation failed, redirecting to home');
      router.replace('/(tabs)/home');
    }
  };

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

  // Calculate stable header dimensions
  const getHeaderHeight = () => {
    return Platform.select({
      ios: 44 + Math.max(insets.top, 20), // iOS nav bar + safe area
      android: 56 + statusBarHeight, // Android app bar + status bar
      default: 60, // Web
    });
  };

  const getContentHeight = () => {
    return Platform.select({
      ios: 44,
      android: 56,
      default: 60,
    });
  };

  return (
    <ThemedView style={[
      styles.container, 
      { 
        backgroundColor,
        height: getHeaderHeight(),
        // Lock positioning to prevent displacement
        position: 'relative',
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        // Prevent flex shrinking/growing
        flexShrink: 0,
        flexGrow: 0,
      }
    ]}>
      {/* Status bar configuration */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor} 
        translucent={false}
        hidden={false}
      />
      
      {/* iOS safe area spacer */}
      {Platform.OS === 'ios' && (
        <View style={{ 
          height: Math.max(insets.top, 20), 
          backgroundColor,
          width: '100%',
        }} />
      )}
      
      {/* Android status bar spacer */}
      {Platform.OS === 'android' && (
        <View style={{ 
          height: statusBarHeight, 
          backgroundColor,
          width: '100%',
        }} />
      )}
      
      {/* Header content */}
      <View style={[
        styles.headerContent, 
        { 
          backgroundColor,
          height: getContentHeight(),
          width: '100%',
        }
      ]}>
        {/* Left section */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome 
                name="chevron-left" 
                size={Platform.select({ ios: 22, android: 20, default: 20 })} 
                color={textColor} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Center section */}
        <View style={styles.centerSection} pointerEvents="none">
          <ThemedText 
            style={[styles.headerTitle, { color: textColor }]} 
            numberOfLines={1} 
            ellipsizeMode="tail" 
            selectable={false}
          >
            {title}
          </ThemedText>
        </View>
        
        {/* Right section */}
        <View style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity 
              onPress={handleSearchPress} 
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="search" size={18} color={textColor} />
            </TouchableOpacity>
          )}
          
          {showNotification && (
            <TouchableOpacity 
              onPress={handleNotificationPress} 
              style={[styles.iconButton, styles.notificationButton]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="bell" size={18} color={textColor} />
            </TouchableOpacity>
          )}
          
          {rightComponent && rightComponent}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    // Ensure header stays at top
    alignSelf: 'stretch',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    // Lock dimensions
    minHeight: Platform.select({
      ios: 44,
      android: 56,
      default: 60,
    }),
    maxHeight: Platform.select({
      ios: 44,
      android: 56,
      default: 60,
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 60,
    height: '100%',
    // Prevent flex changes
    flexShrink: 0,
    flexGrow: 0,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: '100%',
    // Ensure text stays centered
    minWidth: 0, // Allow text to shrink
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 60,
    height: '100%',
    // Prevent flex changes
    flexShrink: 0,
    flexGrow: 0,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginLeft: -6,
    borderRadius: 8,
    // Ensure button stays clickable
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    // Prevent size changes
    flexShrink: 0,
    flexGrow: 0,
  },
  notificationButton: {
    position: 'relative',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    // Ensure consistent text rendering
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({
      ios: 22,
      android: 24,
      default: 22,
    }),
    // Allow text to shrink if needed
    flex: 1,
  },
});