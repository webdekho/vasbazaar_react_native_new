import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
// import { useFocusEffect } from '@react-navigation/native';
// import React, { useCallback } from 'react';
import DeepLinkHandler from '../components/DeepLinkHandler';
import AadhaarNumber from '../screen/Authentication/AadhaarNumber';
import AadhaarOtpValidate from '../screen/Authentication/AadhaarOtpValidate';
import OtpValidate from '../screen/Authentication/OtpValidate';
import PinGenerate from '../screen/Authentication/PinGenerate';
import SignIn from '../screen/Authentication/SignIn';

const Stack = createStackNavigator();

export default function AuthStack({ initialReferralCode }) {
  return (
    <Stack.Navigator
      initialRouteName="sign_in"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // 👈 Left-to-right animation
      }}
    >
      <Stack.Screen 
        name="sign_in" 
        component={SignIn} 
        initialParams={{ code: initialReferralCode }}
      />
      <Stack.Screen name="otp_validate" component={OtpValidate} />
      <Stack.Screen name="aadhaar_number" component={AadhaarNumber} />
      <Stack.Screen name="aadhaar_otp_validate" component={AadhaarOtpValidate} />
      <Stack.Screen name="PinGenerate" component={PinGenerate} options={{ title: "Generate PIN" }} />
      <Stack.Screen name="DeepLinkHome" component={DeepLinkHandler} />
      <Stack.Screen name="HomeRoute" component={DeepLinkHandler} />
    </Stack.Navigator>
  );
}