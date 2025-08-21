import CommonHedder from '../components/CommonHedder';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, SafeAreaView, Text } from 'react-native';
import { BottomNavigation, Icon } from 'react-native-paper';
import History from '../screen/Pages/DrawerPage/History';
import Home from '../screen/Pages/DrawerPage/Home';
import Profile from '../screen/Pages/DrawerPage/Profile';
import Rewards from '../screen/Pages/DrawerPage/Rewards';

const routeKeyMap = {
  home: 0,
  history: 1,
  rewards: 2,
  profile: 3,
};

const SceneComponents = {
  home: React.memo(Home),
  history: React.memo(History),
  rewards: React.memo(Rewards),
  profile: React.memo(Profile),
};

export default function BottomNav({ route, navigation }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (route?.params?.screen) {
      const screenKey = route.params.screen.toLowerCase();
      if (routeKeyMap[screenKey] !== undefined) {
        setIndex(routeKeyMap[screenKey]);
      }
    }
  }, [route]);

  const routes = [
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'history', title: 'History', focusedIcon: 'history', unfocusedIcon: 'history' },
    { key: 'rewards', title: 'Wallet', focusedIcon: 'wallet', unfocusedIcon: 'wallet-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ];

  const renderScene = useCallback(
    BottomNavigation.SceneMap({
      home: () => <SceneComponents.home navigation={navigation} />,
      history: () => <SceneComponents.history navigation={navigation} />,
      rewards: () => <SceneComponents.rewards navigation={navigation} />,
      profile: () => <SceneComponents.profile navigation={navigation} />,
    }),
    [navigation]
  );

  const renderIcon = ({ route, focused, color }) => {
    const iconName = focused ? route.focusedIcon : route.unfocusedIcon;
    const iconColor = focused ? '#000000' : '#aaaaaa'; // Active icon black, inactive gray
    return <Icon source={iconName} color={iconColor} size={24} />;
  };

  const renderLabel = ({ route, focused }) => {
    const labelColor = focused ? '#ffffff' : '#aaaaaa'; // Active text white, inactive gray
    return (
      <Text style={{ fontSize: 12, color: labelColor, textAlign: 'center' }}>
        {route.title}
      </Text>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <CommonHedder hedding={'VAS BAZAAR'} />

      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        labeled={true}
        shifting={false}
        sceneAnimationEnabled={true}
        renderIcon={renderIcon}
        renderLabel={renderLabel}
        barStyle={{
          backgroundColor: '#000000',
          borderTopColor: '#444',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 80 : 70,
        }}
      />
    </SafeAreaView>
  );
}
