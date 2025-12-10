import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MarketplaceHomeScreen from '../screens/MarketplaceHomeScreen';
import MarketplaceCategoryScreen from '../screens/MarketplaceCategoryScreen';
import TransportScreen from '../screens/TransportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';

export type MainStackParamList = {
    Home: undefined;
    Explore: undefined;
    Marketplace: undefined;
    MarketplaceCategory: { categoryId: string; categoryName: string };
    Transport: undefined;
    Profile: undefined;
    ProductDetails: { productId: string };
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
            <Stack.Screen name="MarketplaceCategory" component={MarketplaceCategoryScreen} />
            <Stack.Screen name="Transport" component={TransportScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        </Stack.Navigator>
    );
};

export default MainStack;
