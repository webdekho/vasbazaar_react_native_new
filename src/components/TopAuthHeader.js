import React from 'react';
import { Image, View } from 'react-native';
import PropTypes from 'prop-types';

import { styles } from './styles';

/**
 * Top authentication header component that displays the app logo/branding.
 * Used in authentication screens to provide consistent branding.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {string} [props.headerText] - Optional header text (currently unused)
 * @param {string} [props.headerTitle] - Optional header title (currently unused)
 * @returns {React.ReactElement} The rendered TopAuthHeader component
 * 
 * @example
 * // Basic auth header
 * <TopAuthHeader />
 * 
 * @example
 * // Auth header with optional props (for future use)
 * <TopAuthHeader 
 *   headerText="Welcome" 
 *   headerTitle="Sign In" 
 * />
 */
export default function TopAuthHeader({ headerText, headerTitle }) {
  return (
    <View style={styles.background}>
      <Image
        source={require('../../assets/vas.jpg')}
        style={styles.headerImage}
        resizeMode="contain"
        onError={() => {
          // Handle image loading error silently
        }}
      />
    </View>
  );
}

// PropTypes validation
TopAuthHeader.propTypes = {
  headerText: PropTypes.string,
  headerTitle: PropTypes.string,
};

TopAuthHeader.defaultProps = {
  headerText: null,
  headerTitle: null,
};