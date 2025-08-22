import React, { useContext, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';

import { AuthContext } from '../context/AuthContext';

/**
 * Logout component that automatically logs out the user when rendered.
 * Calls the logout function from AuthContext and displays a simple logout message.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {Object} [props.navigation] - React Navigation object (currently unused)
 * @returns {React.ReactElement} The rendered LogOutApp component
 * 
 * @example
 * // Used in navigation stack for logout functionality
 * <LogOutApp navigation={navigation} />
 */
export default function LogOutApp({ navigation }) {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    /**
     * Performs logout operation on component mount
     */
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        // Handle logout error silently
      }
    };

    performLogout();
  }, [logout]); 

  return (
    <View style={styles.container}>
      <Text style={styles.logoutText}>Logging Out...</Text>
    </View>
  );
}

// PropTypes validation
LogOutApp.propTypes = {
  navigation: PropTypes.object,
};

LogOutApp.defaultProps = {
  navigation: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logoutText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
});