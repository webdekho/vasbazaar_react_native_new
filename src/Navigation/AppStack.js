import React from 'react';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import PropTypes from 'prop-types';

// Components
import DeepLinkHandler from '../components/DeepLinkHandler';

// Navigation
import DrawerNavigation from '../Navigation/DrawerNavigation/DrawerNavigation';

// Screen imports organized by feature
// General Pages
import AddBank from '../screen/Pages/AddBank';
import AllServices from '../screen/Pages/AllServices';
import AutoPay from '../screen/Pages/AutoPay';
import CouponList from '../screen/Pages/CouponList';
import Help from '../screen/Pages/Help';
import Notification from '../screen/Pages/Notification';
import Complaint from '../screen/Pages/Complaint';
import QrPrint from '../screen/Pages/QrPrint';

// BBPS (Bill Payment) Screens
import BillerList from '../screen/Pages/bbps/BillerList';
import PayBill from '../screen/Pages/bbps/PayBill';
import ViewBill from '../screen/Pages/bbps/ViewBill';

// DTH Screens
import DthOperatorList from '../screen/Pages/dth/DthOperatorList';
import DthPlan from '../screen/Pages/dth/DthPlan';
import DthRecharge from '../screen/Pages/dth/Recharge';

// Mobile Recharge Screens
import ContactList from '../screen/Pages/mobile_recharge/ContactList';
import Payment from '../screen/Pages/mobile_recharge/Payment';
import Processing from '../screen/Pages/mobile_recharge/Processing';
import Recharge from '../screen/Pages/mobile_recharge/Recharge';
import RechargePlan from '../screen/Pages/mobile_recharge/RechargePlan';
import Success from '../screen/Pages/mobile_recharge/Success';


const Stack = createStackNavigator();

/**
 * App Stack Navigator
 * Main navigation stack for authenticated users
 * Contains all the screens accessible after successful authentication
 * 
 * @param {Object} props - Component props
 * @param {Object} props.authFunctions - Authentication functions to pass to screens
 * @returns {JSX.Element} Stack navigator with all app screens
 */
export default function AppStack({ authFunctions }) {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={DrawerNavigation}
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
        name="ContactList" 
        component={ContactList}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="RechargePlan" 
        component={RechargePlan} 
        options={{ title: "Recharge Plan" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Recharge" 
        component={Recharge} 
        options={{ title: "Recharge" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Payment" 
        component={Payment} 
        options={{ title: "Payment" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Processing" 
        component={Processing} 
        options={{ title: "Processing" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Success" 
        component={Success} 
        options={{ title: "Success" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="BillerList" 
        component={BillerList} 
        options={{ title: "Select Biller" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="PayBill" 
        component={PayBill} 
        options={{ title: "Pay Bill" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="ViewBill" 
        component={ViewBill} 
        options={{ title: "Fetch Bill", headerShown: false }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="QrPrint" 
        component={QrPrint} 
        options={{ title: "Qr Print" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="AddBank" 
        component={AddBank} 
        options={{ title: "Add Bank Account" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Notification" 
        component={Notification} 
        options={{ title: "Notification" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Complaint" 
        component={Complaint} 
        options={{ title: "Complaint" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="Help" 
        component={Help} 
        options={{ title: "Help" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="AutoPay" 
        component={AutoPay} 
        options={{ title: "AutoPay" }}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="CouponList" 
        component={CouponList}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="AllServices" 
        component={AllServices}
        initialParams={{ authFunctions }}
      />
      
      <Stack.Screen 
        name="NotFound" 
        component={DrawerNavigation}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="DthOperatorList" 
        component={DthOperatorList}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="DthRecharge" 
        component={DthRecharge}
        initialParams={{ authFunctions }}
      />
      <Stack.Screen 
        name="DthPlan" 
        component={DthPlan}
        initialParams={{ authFunctions }}
      />
      
    </Stack.Navigator>
  );
}

// PropTypes for better type checking
AppStack.propTypes = {
  authFunctions: PropTypes.object,
};
