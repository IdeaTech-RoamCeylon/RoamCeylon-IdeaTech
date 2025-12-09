import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MarketplaceHomeScreen from '../screens/MarketplaceHomeScreen';
import TransportScreen from '../screens/TransportScreen';
import ProfileScreen from '../screens/ProfileScreen';
export type MainStackParamList = {
    Home: undefined;
    Explore: undefined;
    Marketplace: undefined;
    Transport: undefined;
    Profile: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

const MainStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceHomeScreen} />
            <Stack.Screen name="Transport" component={TransportScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
};

export default MainStack;
