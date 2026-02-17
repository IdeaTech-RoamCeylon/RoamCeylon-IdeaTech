import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from '../types';
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import MarketplaceHomeScreen from '../screens/marketplace/MarketplaceHomeScreen';
import MarketplaceCategoryScreen from '../screens/marketplace/MarketplaceCategoryScreen';
import ProductDetailsScreen from '../screens/marketplace/ProductDetailsScreen';
import TransportScreen from '../screens/transport/TransportScreen';
import TransportLocationPickerScreen from '../screens/transport/TransportLocationPickerScreen';
import TransportStatusScreen from '../screens/transport/TransportStatusScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AITripPlannerScreen from '../screens/planner/AITripPlannerScreen';
import SavedTripsScreen from '../screens/planner/SavedTripsScreen';
import AIWelcomeScreen from '../screens/planner/AIWelcomeScreen';
import AIHomeScreen from '../screens/planner/AIHomeScreen';
import AIChatScreen from '../screens/planner/AIChat';

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
            <Stack.Screen name="MarketplaceCategory" component={MarketplaceCategoryScreen} />
            <Stack.Screen name="Transport" component={TransportScreen} />
            <Stack.Screen name="TransportLocationPicker" component={TransportLocationPickerScreen} />
            <Stack.Screen name="TransportStatus" component={TransportStatusScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="AIWelcome" component={AIWelcomeScreen} />
            <Stack.Screen name="AIHome" component={AIHomeScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="AITripPlanner" component={AITripPlannerScreen} />
            <Stack.Screen name="SavedTrips" component={SavedTripsScreen} />
        </Stack.Navigator>
    );
};

export default MainStack;
