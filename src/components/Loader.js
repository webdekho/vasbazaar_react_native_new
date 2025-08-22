import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Loading overlay component that displays a spinner over the entire screen.
 * Used to indicate loading states throughout the application.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {boolean} props.isLoading - Whether to show the loading overlay
 * @returns {React.ReactElement|null} The rendered Loader component or null
 * 
 * @example
 * // Basic loader usage
 * <Loader isLoading={loading} />
 * 
 * @example
 * // Conditional loading
 * <Loader isLoading={submittingForm} />
 */
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

// PropTypes validation
Loader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

export default Loader;
