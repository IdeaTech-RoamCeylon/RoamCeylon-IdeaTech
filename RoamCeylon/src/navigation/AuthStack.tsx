import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import GoogleSignInScreen from '../screens/auth/GoogleSignInScreen';

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
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="GoogleSignIn" component={GoogleSignInScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
