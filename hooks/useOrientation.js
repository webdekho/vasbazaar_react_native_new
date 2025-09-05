import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export function useOrientation() {
  const [orientation, setOrientation] = useState(getOrientation());
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 'landscape' : 'portrait';
  }

  // Enhanced device detection for iPhone 16 Pro and other modern devices
  function getDeviceInfo() {
    const { width, height } = dimensions;
    const screenData = Dimensions.get('screen');
    
    // iPhone 16 Pro specific detection
    const isIPhone16Pro = Platform.OS === 'ios' && 
      ((width === 393 && height === 852) || (width === 852 && height === 393));
    
    // Modern iPhone with Dynamic Island/Notch detection
    const hasNotch = Platform.OS === 'ios' && 
      (height >= 812 || width >= 812);
    
    return {
      isIPhone16Pro,
      hasNotch,
      screenData,
      aspectRatio: Math.max(width, height) / Math.min(width, height)
    };
  }

  useEffect(() => {
    const updateOrientation = ({ window }) => {
      setDimensions(window);
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const deviceInfo = getDeviceInfo();

  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    dimensions,
    width: dimensions.width,
    height: dimensions.height,
    ...deviceInfo,
  };
}

// Helper function to get responsive styles based on orientation
export function getOrientationStyles(orientation, styles) {
  const baseStyles = styles.common || {};
  const orientationStyles = orientation === 'landscape' ? styles.landscape : styles.portrait;
  
  return {
    ...baseStyles,
    ...orientationStyles,
  };
}