import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { useTheme } from 'react-native-paper';


import LogOutApp from '../../components/LogOutApp';
import BottomNavigation from '../../Navigation/BottomNavigation';

import Profile from '../../screen/Pages/DrawerPage/Profile';
import Rewards from '../../screen/Pages/DrawerPage/Rewards';
import CustomDrawerContent from './DrawerDesign';

const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
  const theme = useTheme(); // 🟦 Get Paper theme (colors, fonts, etc.)

  return (
    
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurface,
        drawerLabelStyle: {
          fontSize: 15,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={BottomNavigation} />
      <Drawer.Screen name="Home" component={BottomNavigation} />
      <Drawer.Screen name="History" component={BottomNavigation} />
      {/* <Drawer.Screen name="History" component={History} /> */}
      <Drawer.Screen name="Rewards" component={Rewards} />
      <Drawer.Screen name="Profile" component={Profile} />
      
      <Drawer.Screen name="log_out" component={LogOutApp} />
    </Drawer.Navigator>
  );
}
