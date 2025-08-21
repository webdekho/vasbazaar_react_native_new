import { AuthContext } from '../context/AuthContext';
import { CommonActions } from '@react-navigation/native';
import { useContext, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function DeepLinkHandler({ navigation, route }) {
  const { userToken, secureToken, logout } = useContext(AuthContext);

  useEffect(() => {
    const handleNavigation = () => {
      console.log('DeepLinkHandler - Tokens:', { userToken: !!userToken, secureToken: !!secureToken });
      
      if (secureToken && userToken) {
        // User is fully authenticated, navigate to main app
        console.log('DeepLinkHandler - Navigating to Home (fully authenticated)');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
      } else if (secureToken && !userToken) {
        // User has secure token but needs to validate PIN
        console.log('DeepLinkHandler - Navigating to PinValidate');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'PinValidate' }],
          })
        );
      } else {
        // No tokens, redirect to sign in
        console.log('DeepLinkHandler - Navigating to sign_in');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'sign_in' }],
          })
        );
      }
    };

    // Add a small delay to ensure auth context is loaded
    const timer = setTimeout(handleNavigation, 300);

    return () => clearTimeout(timer);
  }, [navigation, userToken, secureToken]);

  // Show loading while checking authentication
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f5f7fa',
      padding: 20
    }}>
      <ActivityIndicator size="large" color="#0f60bd" />
      <Text style={{ 
        marginTop: 20, 
        fontSize: 16, 
        color: '#666', 
        textAlign: 'center' 
      }}>
        Checking authentication...
      </Text>
    </View>
  );
}