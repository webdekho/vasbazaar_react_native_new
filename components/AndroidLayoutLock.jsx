import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, Dimensions, StatusBar } from 'react-native';

/**
 * AndroidLayoutLock - Prevents layout shifts on Android by locking UI elements
 */
const AndroidLayoutLock = ({ children, isActive = false }) => {
  const dimensionsRef = useRef(Dimensions.get('window'));
  const layoutRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'android' && isActive) {
      // Lock the current screen dimensions
      const currentDims = Dimensions.get('window');
      dimensionsRef.current = currentDims;

      // Prevent status bar changes
      StatusBar.setHidden(false, 'none');
      StatusBar.setBackgroundColor('#ffffff', false);
      StatusBar.setBarStyle('dark-content', false);

      // Lock viewport meta tag on web view
      if (typeof document !== 'undefined') {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          const originalContent = viewport.content;
          viewport.content = `width=${currentDims.width}, height=${currentDims.height}, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0`;
          
          return () => {
            viewport.content = originalContent;
          };
        }
      }
    }
  }, [isActive]);

  if (Platform.OS !== 'android') {
    return children;
  }

  return (
    <View
      ref={layoutRef}
      style={[
        styles.container,
        isActive && {
          // When active, lock all dimensions
          width: dimensionsRef.current.width,
          height: dimensionsRef.current.height,
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AndroidLayoutLock;