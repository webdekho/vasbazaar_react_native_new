import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function MainHeader({ 
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

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    try {
      // Try to go back in navigation stack
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback: navigate to home tab if no previous screen
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      // If router.back() fails, fallback to home
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

  const getHeaderPaddingTop = () => {
    if (Platform.OS === 'ios') {
      return Math.max(insets.top + 5, 35); // iOS: safe area + padding, minimum 35 (reduced from 45)
    } else if (Platform.OS === 'android') {
      return Math.max(insets.top + 5, 15); // Android: safe area + padding, minimum 15 (reduced from 20)
    } else {
      return Math.max(insets.top, 10); // Web/other: minimum 10 (reduced from 15)
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Platform-specific StatusBar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor} 
        translucent={Platform.OS === 'android'}
        hidden={false}
      />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor,
          paddingTop: getHeaderPaddingTop(),
          minHeight: Platform.select({
            ios: 70, // iOS standard navigation bar height (reduced from 88)
            android: 45, // Android app bar height + status bar (reduced from 56)
            default: 50, // Web standard (reduced from 60)
          }) + (Platform.OS === 'ios' ? insets.top : 0),
        }
      ]}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <FontAwesome 
                name="chevron-left" 
                size={Platform.select({ ios: 20, android: 18, default: 18 })} 
                color={textColor} 
              />
            </TouchableOpacity>
          )}
        </View>
        
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
        
        <View style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
              <FontAwesome name="search" size={16} color={textColor} />
            </TouchableOpacity>
          )}
          
          {showNotification && (
            <TouchableOpacity onPress={handleNotificationPress} style={[styles.iconButton, styles.notificationButton]}>
              <FontAwesome name="bell" size={16} color={textColor} />
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({
      ios: 20,
      android: 16,
      default: 20,
    }),
    paddingBottom: Platform.select({
      ios: 8, // Reduced from 12
      android: 6, // Reduced from 10
      default: 8, // Reduced from 12
    }),
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {},
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: Platform.select({
      ios: 60,
      android: 56,
      default: 60,
    }),
    height: Platform.select({
      ios: 36, // Reduced from 44
      android: 32, // Reduced from 40
      default: 36, // Reduced from 44
    }),
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 12,
      default: 16,
    }),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: Platform.select({
      ios: 60,
      android: 56,
      default: 60,
    }),
    height: Platform.select({
      ios: 36, // Reduced from 44
      android: 32, // Reduced from 40
      default: 36, // Reduced from 44
    }),
  },
  backButton: {
    paddingVertical: Platform.select({
      ios: 12,
      android: 10,
      default: 12,
    }),
    paddingHorizontal: Platform.select({
      ios: 12,
      android: 10,
      default: 12,
    }),
    marginLeft: Platform.select({
      ios: -4,
      android: -2,
      default: -4,
    }),
    borderRadius: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notificationButton: {
    position: 'relative',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Platform.select({
      ios: 10,
      android: 8,
      default: 10,
    }),
    fontSize: Platform.select({
      ios: 17,
      android: 16,
      default: 17,
    }),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});