import { Platform, StatusBar, Dimensions } from 'react-native';

/**
 * iOS Header Debug Utility
 * Use this to debug header positioning issues on iOS devices
 */
export const debugIOSHeader = (insets) => {
  if (Platform.OS !== 'ios') {
    console.log('🤖 Not iOS - header debug not needed');
    return;
  }

  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  
  const debugInfo = {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    statusBarHeight: StatusBar.currentHeight,
    safeAreaInsets: insets,
    screenDimensions: screen,
    windowDimensions: window,
    calculatedStatusBarHeight: Math.max(insets?.top || 0, 20),
    isIPhoneX: insets?.top > 20, // Likely iPhone X or newer
    recommendations: [],
  };

  // Add recommendations based on the device
  if (insets?.top === 0) {
    debugInfo.recommendations.push('⚠️ Safe area top is 0 - check SafeAreaProvider setup');
  }
  
  if (insets?.top < 20) {
    debugInfo.recommendations.push('⚠️ Safe area top is less than 20px - using minimum fallback');
  }
  
  if (insets?.top > 50) {
    debugInfo.recommendations.push('✅ iPhone X+ device detected - using safe area spacing');
  }
  
  if (screen.height !== window.height) {
    debugInfo.recommendations.push('📱 Status bar is visible - height difference detected');
  }

  console.log('🍎 iOS HEADER DEBUG INFO:');
  console.log('📊 Device Info:', debugInfo);
  
  // Visual indicator for debugging
  if (__DEV__) {
    console.log(`
🍎 iOS Header Debug Summary:
📱 Device: ${debugInfo.isIPhoneX ? 'iPhone X+' : 'Legacy iPhone'}
📏 Status Bar Height: ${debugInfo.calculatedStatusBarHeight}px
🔒 Safe Area Top: ${insets?.top}px
${debugInfo.recommendations.map(rec => `   ${rec}`).join('\n')}
    `);
  }
  
  return debugInfo;
};

/**
 * Get optimal header configuration for current iOS device
 */
export const getIOSHeaderConfig = (insets) => {
  if (Platform.OS !== 'ios') {
    return { statusBarHeight: 0, headerPadding: 0 };
  }

  const statusBarHeight = Math.max(insets?.top || 0, 20);
  
  return {
    statusBarHeight,
    headerPadding: statusBarHeight,
    statusBarStyle: 'dark-content',
    backgroundColor: '#ffffff',
    usesSafeArea: insets?.top > 20,
    deviceType: insets?.top > 40 ? 'iphone-x-plus' : 'legacy-iphone',
  };
};

/**
 * Common iOS header styles that work across all devices
 */
export const getIOSHeaderStyles = (insets, backgroundColor = '#ffffff') => {
  const config = getIOSHeaderConfig(insets);
  
  return {
    container: {
      backgroundColor,
      paddingTop: Platform.OS === 'ios' ? config.statusBarHeight : 0,
    },
    statusBarSpacer: Platform.OS === 'ios' ? {
      height: config.statusBarHeight,
      backgroundColor,
    } : null,
    headerContent: {
      height: Platform.select({ ios: 44, android: 56, default: 56 }),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
  };
};