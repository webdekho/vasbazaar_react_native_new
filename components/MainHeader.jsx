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

  return (
    <>
      {/* Platform-specific StatusBar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor} 
        translucent={false}
        hidden={false}
      />
      
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Status bar spacer for iOS */}
        {Platform.OS === 'ios' && (
          <View style={{ height: insets.top, backgroundColor }} />
        )}
        
        {/* Header */}
        <View style={[
          styles.header, 
          { 
            backgroundColor,
            height: Platform.select({
              ios: 44, // iOS standard nav bar height
              android: 56, // Android standard app bar height
              default: 60, // Web standard
            }),
          }
        ]}>
          <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            {showBack && (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <FontAwesome 
                  name="chevron-left" 
                  size={Platform.select({ ios: 22, android: 20, default: 20 })} 
                  color={textColor} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.centerSection} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <View style={styles.iosTitleContainer}>
                <ThemedText 
                  style={[styles.headerTitle, styles.iosHeaderTitle, { color: textColor }]} 
                  numberOfLines={1} 
                  ellipsizeMode="tail" 
                  selectable={false}
                >
                  {title}
                </ThemedText>
              </View>
            ) : (
              <ThemedText 
                style={[styles.headerTitle, { color: textColor }]} 
                numberOfLines={1} 
                ellipsizeMode="tail" 
                selectable={false}
              >
                {title}
              </ThemedText>
            )}
          </View>
          
          <View style={styles.rightSection}>
            {showSearch && (
              <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
                <FontAwesome name="search" size={18} color={textColor} />
              </TouchableOpacity>
            )}
            
            {showNotification && (
              <TouchableOpacity onPress={handleNotificationPress} style={[styles.iconButton, styles.notificationButton]}>
                <FontAwesome name="bell" size={18} color={textColor} />
              </TouchableOpacity>
            )}
            
            {rightComponent && rightComponent}
          </View>
        </View>
      </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
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
  headerContent: {
    height: Platform.select({
      ios: 44, // iOS standard nav content height
      android: 56, // Android standard toolbar height
      default: 60,
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({
      ios: 16,
      android: 16,
      default: 20,
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
    height: '100%',
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
    ...Platform.select({
      ios: {
        // iOS-specific center alignment
        height: 44, // Explicit height matching headerContent
        flexDirection: 'row', // Change to row for better alignment
      },
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
    height: '100%',
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
    textAlign: 'center',
    fontSize: Platform.select({
      ios: 17,
      android: 18,
      default: 18,
    }),
    fontWeight: '600',
    color: '#FFFFFF',
    ...Platform.select({
      ios: {
        // iOS-specific fixes for proper center alignment
        lineHeight: 44, // Match header content height
        textAlignVertical: undefined, // Remove this property on iOS
        includeFontPadding: false,
        height: 44,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
      },
      android: {
        lineHeight: 24,
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
      default: {
        lineHeight: 22,
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  iosTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosHeaderTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: undefined,
  },
});