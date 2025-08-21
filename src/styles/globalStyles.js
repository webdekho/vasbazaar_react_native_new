import { Platform, StyleSheet } from 'react-native';

// Global styles to prevent iOS zoom and layout shifts
export const globalStyles = StyleSheet.create({
  // Prevent iOS bounce and overscroll
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        // Prevent bounce effect
        overflow: 'hidden',
      },
      web: {
        // Prevent body scroll on web
        height: '100vh',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },

  // Scrollable content container
  scrollContainer: {
    flexGrow: 1,
    ...Platform.select({
      ios: {
        // Smooth scrolling on iOS
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },

  // Keyboard avoiding view styles
  keyboardAvoidingView: {
    flex: 1,
    ...Platform.select({
      ios: {
        behavior: 'padding',
      },
      android: {
        behavior: 'height',
      },
    }),
  },

  // Input focus styles to prevent zoom
  noZoomInput: {
    ...Platform.select({
      ios: {
        fontSize: 16, // Minimum to prevent zoom
        WebkitTextSizeAdjust: '100%',
        transform: [{ scale: 1 }], // Prevent any scaling
      },
      web: {
        fontSize: 16,
        WebkitTextSizeAdjust: '100%',
        textSizeAdjust: '100%',
      },
    }),
  },

  // Disable user selection where not needed
  noSelect: {
    ...Platform.select({
      web: {
        WebkitUserSelect: 'none',
        userSelect: 'none',
      },
      ios: {
        WebkitUserSelect: 'none',
      },
    }),
  },

  // Fixed position elements (headers, footers)
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        // Account for safe area
        paddingTop: 0, // Will be handled by SafeAreaView
      },
    }),
  },

  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        // Account for safe area
        paddingBottom: 0, // Will be handled by SafeAreaView
      },
    }),
  },
});

// Platform-specific configurations
export const platformConfig = {
  ios: {
    // Disable zoom on double tap
    disableDoubleTapZoom: true,
    // Minimum font size to prevent zoom
    minimumFontSize: 16,
    // Input field configurations
    inputConfig: {
      autoCorrect: false,
      autoCapitalize: 'none',
      spellCheck: false,
    },
  },
  android: {
    // Android specific configs
    inputConfig: {
      autoCorrect: false,
      autoCapitalize: 'none',
    },
  },
  web: {
    // Web specific configs
    inputConfig: {
      autoCorrect: false,
      autoCapitalize: 'none',
      spellCheck: false,
    },
  },
};

// Helper function to get platform-specific input props
export const getInputProps = () => {
  const platform = Platform.OS;
  return {
    ...platformConfig[platform]?.inputConfig,
    style: globalStyles.noZoomInput,
  };
};

// Export utility to wrap screens with safe area and keyboard handling
export const ScreenWrapper = ({ children, style, noScroll = false }) => {
  const { SafeAreaView, KeyboardAvoidingView, ScrollView, View } = require('react-native');
  
  const content = noScroll ? (
    <View style={[globalStyles.safeContainer, style]}>
      {children}
    </View>
  ) : (
    <ScrollView
      style={globalStyles.safeContainer}
      contentContainerStyle={[globalStyles.scrollContainer, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={Platform.OS !== 'ios'} // Disable bounce on iOS
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={globalStyles.safeContainer}>
      <KeyboardAvoidingView
        style={globalStyles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default globalStyles;