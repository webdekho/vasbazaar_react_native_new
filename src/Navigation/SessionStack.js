import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import DeepLinkHandler from '../components/DeepLinkHandler';
import PinValidate from '../screen/Authentication/PinValidate';
import OtpPinValidate from '../screen/Authentication/OtpPinValidate';
import PinGenerate from '../screen/Authentication/PinGenerate';


const Stack = createStackNavigator();

export default function SessionStack({ authFunctions }) {
  return (
    <Stack.Navigator
      initialRouteName="PinValidate"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      
      <Stack.Screen 
        name="PinValidate" 
        component={PinValidate} 
        options={{ title: "Validate PIN" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="otpPinValidate" 
        component={OtpPinValidate} 
        options={{ title: "OTP PIN Validate" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="PinGenerate" 
        component={PinGenerate} 
        options={{ title: "Generate PIN" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="DeepLinkHome" 
        component={DeepLinkHandler}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="HomeRoute" 
        component={DeepLinkHandler}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="NotFound" 
        component={PinValidate} 
        options={{ title: "Validate PIN" }}
        initialParams={{ authFunctions }}
      />
      
    </Stack.Navigator>
  );
}
