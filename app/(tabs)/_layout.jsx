import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrientation } from '../../hooks/useOrientation';

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
  const { isLandscape, isIPhone16Pro, hasNotch } = useOrientation();

  // Calculate dynamic tab bar height with safe area support - compact design
  const getTabBarHeight = () => {
    let baseHeight = isLandscape ? 50 : 60;
    
    // Web browser needs extra height for proper label display
    if (Platform.OS === 'web') {
      baseHeight = isLandscape ? 60 : 70; // Reduced height
    }
    
    // Adjust for iPhone 16 Pro and other modern devices
    if (isIPhone16Pro) {
      baseHeight = isLandscape ? 55 : 65;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 70 : 80; // Reduced for iPhone 16 Pro web
      }
    } else if (hasNotch) {
      baseHeight = isLandscape ? 52 : 62;
      if (Platform.OS === 'web') {
        baseHeight = isLandscape ? 65 : 75; // Reduced for notched web
      }
    }
    
    const bottomSafeArea = insets.bottom;
    return baseHeight + bottomSafeArea;
  };

  // Simple icon size
  const getIconSize = (focused) => {
    return focused ? 24 : 20;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#95a5a6',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          height: getTabBarHeight(),
          paddingBottom: Platform.select({
            web: Math.max(insets.bottom, 6), // Reduced bottom padding for web
            default: Math.max(insets.bottom, 2),
          }),
          paddingTop: Platform.select({
            web: 4, // Reduced top padding for web
            default: 2,
          }),
          borderTopWidth: 0, // Remove default border for cleaner look
          elevation: Platform.select({ android: 8, default: 0 }), // Android shadow
          shadowColor: Platform.select({ ios: '#000000', default: 'transparent' }), // iOS shadow
          shadowOffset: Platform.select({ ios: { width: 0, height: -2 }, default: { width: 0, height: 0 } }),
          shadowOpacity: Platform.select({ ios: 0.1, default: 0 }),
          shadowRadius: Platform.select({ ios: 4, default: 0 }),
          // Web specific styles for better rendering
          ...Platform.select({
            web: {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100vw',
              maxWidth: '100vw',
              zIndex: 9999,
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              display: 'flex !important',
              visibility: 'visible !important',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }
          })
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          color: '#ffffff',
          fontWeight: '600',
          marginTop: 1,
          marginBottom: Platform.select({
            web: 4, // Reduced bottom margin for web
            default: 0,
          }),
          paddingBottom: Platform.select({
            web: 2, // Reduced padding for web browsers
            default: 0,
          }),
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={getIconSize(focused)} 
              name="home" 
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Home Tab',
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={getIconSize(focused)} 
              name="history" 
              color={color}
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
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={getIconSize(focused)} 
              name="account-balance-wallet" 
              color={color}
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
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              size={getIconSize(focused)} 
              name="person" 
              color={color}
            />
          ),
          tabBarAccessibilityLabel: 'Profile Tab',
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}
