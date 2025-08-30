import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';

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
  // Platform-specific configurations
  const getTabBarStyle = () => {
    const baseStyle = {
      backgroundColor: '#000000',
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 85 : 70, // Account for iOS safe area
      paddingBottom: Platform.OS === 'ios' ? 20 : 10, // iOS safe area padding
      paddingTop: 10,
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
        // Ensure consistent behavior across platforms
        tabBarHideOnKeyboard: Platform.OS !== 'ios', // Hide on Android/Web when keyboard is open
        tabBarVisibilityAnimationConfig: {
          show: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
          hide: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
        },
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
