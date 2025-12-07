import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OTPScreen from '../screens/OTPScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  PhoneEntry: undefined;
  OTP: undefined;
  ProfileSetup: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
