import { AuthContext } from '../context/AuthContext';
import { useContext, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LogOutApp({ navigation }) {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    logout()
    
  }, []); 

  return (
    <View>
      <Text>LogOut</Text>
    </View>
  );
}

const styles = StyleSheet.create({});