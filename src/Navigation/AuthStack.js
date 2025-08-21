import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import BulletproofSignIn from '../screen/Authentication/BulletproofSignIn';


const Stack = createStackNavigator();

export default function AuthStack({ authFunctions }) {
  console.log('✅ AuthStack rendering...');
  
  return (
    <Stack.Navigator
      initialRouteName="sign_in"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="sign_in" 
        component={BulletproofSignIn}
        initialParams={{ authFunctions }}
      />
    </Stack.Navigator>
  );
}
