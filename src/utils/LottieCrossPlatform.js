/**
 * Lottie Cross-Platform Component
 * 
 * This module provides a cross-platform Lottie animation component that
 * automatically selects the appropriate Lottie library based on the platform:
 * - Uses 'lottie-react' for web platforms
 * - Uses 'lottie-react-native' for mobile platforms (iOS/Android)
 * 
 * This ensures consistent Lottie animation functionality across all platforms
 * while using the most optimized library for each environment.
 * 
 * @module LottieCrossPlatform
 */

// React Native imports
import { Platform } from 'react-native';

/**
 * Cross-platform Lottie component
 * 
 * Dynamically imports the appropriate Lottie library based on the current platform.
 * This allows the same import statement to work across web and mobile platforms.
 * 
 * @type {React.Component}
 * @example
 * import LottieView from '../utils/LottieCrossPlatform';
 * 
 * <LottieView
 *   source={require('./animation.json')}
 *   autoPlay
 *   loop
 *   style={{ width: 100, height: 100 }}
 * />
 */
let LottieView;

try {
  if (Platform.OS === 'web') {
    // Use lottie-react for web platform
    LottieView = require('lottie-react').default;
  } else {
    // Use lottie-react-native for mobile platforms
    LottieView = require('lottie-react-native').default;
  }
} catch (error) {
  // Fallback component in case Lottie libraries are not available
  LottieView = ({ style, ...props }) => {
    console.warn('Lottie library not available, rendering empty view');
    return null;
  };
}

export default LottieView;