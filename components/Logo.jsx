import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export default function Logo({
  size = 'medium',
  variant = 'default',
  style,
  imageStyle,
  source = require('@/assets/images/vasbazaar_logo.png'),
  resizeMode = 'cover',
  ...props
}) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          image: styles.imageSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          image: styles.imageLarge,
        };
      case 'xlarge':
        return {
          container: styles.containerXLarge,
          image: styles.imageXLarge,
        };
      case 'xxlarge':
        return {
          container: styles.containerXXLarge,
          image: styles.imageXXLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          image: styles.imageMedium,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          container: styles.variantCircular,
          image: styles.variantCircular,
        };
      case 'rounded':
        return {
          container: styles.variantRounded,
          image: styles.variantRounded,
        };
      case 'square':
        return {
          container: styles.variantSquare,
          image: styles.variantSquare,
        };
      default:
        return {
          container: styles.variantDefault,
          image: styles.variantDefault,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <ThemedView 
      style={[
        styles.logoContainer,
        sizeStyles.container,
        variantStyles.container,
        style
      ]}
      {...props}
    >
      <Image 
        source={source}
        style={[
          styles.logoImage,
          sizeStyles.image,
          variantStyles.image,
          imageStyle
        ]}
        resizeMode={resizeMode}
      />
    </ThemedView>
  );
}

// Preset logo configurations for easy use
export const LogoPresets = {
  small: { size: 'small' },
  medium: { size: 'medium' },
  large: { size: 'large' },
  xlarge: { size: 'xlarge' },
  xxlarge: { size: 'xxlarge' },
  circular: { variant: 'circular' },
  rounded: { variant: 'rounded' },
  square: { variant: 'square' },
  smallCircular: { size: 'small', variant: 'circular' },
  mediumRounded: { size: 'medium', variant: 'rounded' },
  largeCircular: { size: 'large', variant: 'circular' },
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  // Size Variants
  containerSmall: {
    width: 40,
    height: 20,
  },
  imageSmall: {
    width: 40,
    height: 20,
  },

  containerMedium: {
    width: 80,
    height: 20,
  },
  imageMedium: {
    width: 80,
    height: 20,
  },

  containerLarge: {
    width: 120,
    height: 30,
  },
  imageLarge: {
    width: 120,
    height: 30,
  },

  containerXLarge: {
    width: 160,
    height: 40,
  },
  imageXLarge: {
    width: 160,
    height: 40,
  },

  containerXXLarge: {
    width: 220,
    height: 50,
  },
  imageXXLarge: {
    width: 220,
    height: 50,
  },

  // Variant Styles
  variantDefault: {
    borderRadius: 0,
  },

  variantCircular: {
    borderRadius: 1000, // Large number for perfect circle
    overflow: 'hidden',
  },

  variantRounded: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  variantSquare: {
    borderRadius: 0,
    overflow: 'hidden',
  },
});