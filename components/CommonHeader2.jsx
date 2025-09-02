import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CommonHeader2({ 
  heading, 
  showBackButton = true,
  onBackPress,
  rightComponent,
  headerStyle,
  titleStyle,
  backgroundColor = '#ffffff',
  statusBarStyle = 'dark-content'
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Status Bar */}
      <StatusBar 
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
        translucent={false}
        hidden={false}
      />
      
      <View style={[styles.headerContainer, { backgroundColor }, headerStyle]}>
        {/* iOS Status Bar Spacer */}
        {Platform.OS === 'ios' && (
          <View style={{ 
            height: Math.max(insets.top, 20), // Minimum 20px for older devices
            backgroundColor 
          }} />
        )}
        
        <View style={styles.headerContent}>
          {/* Left Section - Back Button */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity 
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <FontAwesome name="arrow-left" size={20} color="#000" />
              </TouchableOpacity>
            )}
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
              {heading}
            </Text>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Platform.select({ ios: 44, android: 56, default: 56 }),
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});