import { Platform } from 'react-native';

let LottieView;
if (Platform.OS === 'web') {
  LottieView = require('lottie-react').default;
} else {
  LottieView = require('lottie-react-native').default;
}

export default LottieView;