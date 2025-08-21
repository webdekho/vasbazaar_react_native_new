import { ActivityIndicator, StyleSheet, View } from 'react-native';

const Loader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // fills the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent dark
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // ensure it's above everything
  },
});

export default Loader;
