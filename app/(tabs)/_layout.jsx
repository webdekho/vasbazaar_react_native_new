import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
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
  const { height: screenHeight } = Dimensions.get('window');
  
  // Platform-specific configurations
  const getTabBarStyle = () => {
    if (Platform.OS === 'android') {
      // Android: Completely locked positioning to prevent ANY movement
      return {
        backgroundColor: '#000000',
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999, // Maximum z-index
        elevation: 0, // Remove shadow to prevent layer issues
        // Lock dimensions completely
        minHeight: 70,
        maxHeight: 70,
        // Prevent any flex changes
        flexShrink: 0,
        flexGrow: 0,
      };
    }
    
    const baseStyle = {
      backgroundColor: '#000000',
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 85 : 70,
      paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10),
      paddingTop: 10,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
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
      // Web
      return {
        ...baseStyle,
        boxShadow: '0 -4px 8px rgba(0,0,0,0.25)', // CSS box-shadow for web
        borderTop: 'none',
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
        // Android-specific stability settings
        ...(Platform.OS === 'android' && {
          tabBarHideOnKeyboard: false, // Never hide on Android
          tabBarVisibilityAnimationConfig: undefined, // Disable all animations
          freezeOnBlur: true, // Freeze inactive screens
        }),
        // iOS/Web behavior
        ...(Platform.OS !== 'android' && {
          tabBarHideOnKeyboard: true,
          tabBarVisibilityAnimationConfig: {
            show: { animation: 'timing', config: { duration: 200 } },
            hide: { animation: 'timing', config: { duration: 200 } },
          },
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
