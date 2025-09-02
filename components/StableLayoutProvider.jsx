import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dimensions, Platform, StatusBar } from 'react-native';

const StableLayoutContext = createContext();

export const useStableLayout = () => {
  const context = useContext(StableLayoutContext);
  if (!context) {
    throw new Error('useStableLayout must be used within StableLayoutProvider');
  }
  return context;
};

export const StableLayoutProvider = ({ children }) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    
    return {
      window: { width, height },
      screen: { width: screenWidth, height: screenHeight },
      statusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
      isLocked: false,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      // Only update if layout is not locked
      if (!dimensions.isLocked) {
        setDimensions(prev => ({
          ...prev,
          window,
          screen,
          statusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
        }));
      }
    });

    return () => subscription?.remove();
  }, [dimensions.isLocked]);

  const lockLayout = () => {
    setDimensions(prev => ({ ...prev, isLocked: true }));
  };

  const unlockLayout = () => {
    const { width, height } = Dimensions.get('window');
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    
    setDimensions({
      window: { width, height },
      screen: { width: screenWidth, height: screenHeight },
      statusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
      isLocked: false,
    });
  };

  const value = {
    ...dimensions,
    lockLayout,
    unlockLayout,
  };

  return (
    <StableLayoutContext.Provider value={value}>
      {children}
    </StableLayoutContext.Provider>
  );
};