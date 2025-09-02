import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom dark tab bar background - works on all platforms
function CustomTabBarBackground() {
  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject, 
        { 
          backgroundColor: '#000000',
          // Ensure proper background on web
          ...(Platform.OS === 'web' && {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          })
        }
      ]} 
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Platform-specific configurations with enhanced stability
  const getTabBarStyle = () => {
    const safeAreaBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 0);
    
    if (Platform.OS === 'android') {
      // Android: Ultra-stable positioning to prevent ANY movement
      return {
        backgroundColor: '#000000',
        borderTopWidth: 0,
        height: 70 + safeAreaBottom,
        paddingBottom: safeAreaBottom > 0 ? safeAreaBottom : 10,
        paddingTop: 10,
        // Absolute positioning locked to bottom
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // Maximum z-index to stay above everything
        zIndex: 999999,
        elevation: 0, // Remove shadow to prevent layer conflicts
        // Completely lock dimensions
        minHeight: 70 + safeAreaBottom,
        maxHeight: 70 + safeAreaBottom,
        // Prevent any flex behavior changes
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: 'auto',
        // Force layout stability
        alignSelf: 'stretch',
      };
    }
    
    // iOS and Web: Enhanced stability
    const totalHeight = Platform.OS === 'ios' 
      ? 44 + safeAreaBottom + 10 // Content + safe area + padding
      : 60; // Web standard
    
    const baseStyle = {
      backgroundColor: '#000000',
      borderTopWidth: 0,
      height: totalHeight,
      paddingBottom: safeAreaBottom > 0 ? safeAreaBottom : 10,
      paddingTop: 10,
      // Absolute positioning for stability
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999999,
      // Lock dimensions
      minHeight: totalHeight,
      maxHeight: totalHeight,
      flexShrink: 0,
      flexGrow: 0,
      alignSelf: 'stretch',
    };

    // Platform-specific shadow/elevation
    if (Platform.OS === 'ios') {
      return {
        ...baseStyle,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      };
    } else if (Platform.OS === 'android') {
      return {
        ...baseStyle,
        elevation: 10,
      };
    } else {
      // Web - Fixed positioning for consistent display
      return {
        ...baseStyle,
        position: 'fixed', // Use fixed positioning for web
        boxShadow: '0 -4px 8px rgba(0,0,0,0.25)', // CSS box-shadow for web
        borderTop: 'none',
        width: '100%', // Ensure full width
        display: 'flex', // Ensure flex display
        visibility: 'visible', // Explicitly set visibility
      };
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#95a5a6', 
        headerShown: false,
        tabBarBackground: CustomTabBarBackground,
        tabBarStyle: getTabBarStyle(),
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'web' ? 11 : 12, // Slightly smaller on web
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
        // Enhanced stability settings for all platforms
        ...(Platform.OS === 'android' && {
          tabBarHideOnKeyboard: false, // Never hide tab bar on Android
          tabBarVisibilityAnimationConfig: undefined, // Disable visibility animations
          freezeOnBlur: true, // Freeze inactive screens to save memory
          // Additional Android stability
          lazy: false, // Load all tabs immediately
          swipeEnabled: false, // Disable swipe gestures that can cause displacement
        }),
        // iOS stability settings
        ...(Platform.OS === 'ios' && {
          tabBarHideOnKeyboard: false, // Keep tab bar visible on iOS too
          tabBarVisibilityAnimationConfig: undefined, // Disable animations
          // iOS-specific optimizations
          lazy: false,
          swipeEnabled: false,
        }),
        // Web stability settings
        ...(Platform.OS === 'web' && {
          tabBarHideOnKeyboard: false,
          tabBarVisibilityAnimationConfig: undefined,
          lazy: false,
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={Platform.OS === 'web' ? (focused ? 22 : 20) : (focused ? 26 : 24)} 
              name="home" 
              color={color}
              style={{
                // Ensure consistent rendering across platforms
                textAlign: 'center',
                ...(Platform.OS === 'web' && {
                  lineHeight: Platform.OS === 'web' ? 24 : undefined
                })
              }}
            />
          ),
          // Platform-specific accessibility
          tabBarAccessibilityLabel: 'Home Tab',
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={Platform.OS === 'web' ? (focused ? 22 : 20) : (focused ? 26 : 24)} 
              name="history" 
              color={color}
              style={{
                textAlign: 'center',
                ...(Platform.OS === 'web' && {
                  lineHeight: Platform.OS === 'web' ? 24 : undefined
                })
              }}
            />
          ),
          tabBarAccessibilityLabel: 'History Tab',
          tabBarTestID: 'history-tab',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={Platform.OS === 'web' ? (focused ? 22 : 20) : (focused ? 26 : 24)} 
              name="account-balance-wallet" 
              color={color}
              style={{
                textAlign: 'center',
                ...(Platform.OS === 'web' && {
                  lineHeight: Platform.OS === 'web' ? 24 : undefined
                })
              }}
            />
          ),
          tabBarAccessibilityLabel: 'Wallet Tab',
          tabBarTestID: 'wallet-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome 
              size={Platform.OS === 'web' ? (focused ? 22 : 20) : (focused ? 26 : 24)} 
              name="user" 
              color={color}
              style={{
                textAlign: 'center',
                ...(Platform.OS === 'web' && {
                  lineHeight: Platform.OS === 'web' ? 24 : undefined
                })
              }}
            />
          ),
          tabBarAccessibilityLabel: 'Profile Tab',
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}
