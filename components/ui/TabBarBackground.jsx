import { BlurView } from 'expo-blur';
import { Platform, View, StyleSheet } from 'react-native';

export function useBottomTabOverflow() {
  return 0;
}

export function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return <BlurView intensity={100} style={StyleSheet.absoluteFillObject} />;
  }
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />;
}


