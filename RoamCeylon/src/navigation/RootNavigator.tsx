import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';

const RootStack = createStackNavigator();

const Navigation = () => {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth();

  // Show splash while checking stored auth token — prevents white flash on startup
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          // Prevent back button from exiting app unexpectedly
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated || !isProfileComplete ? (
          <RootStack.Screen 
            name="Auth" 
            component={AuthStack}
            options={{
              // Auth stack shouldn't be in history after authentication
              animationTypeForReplace: isAuthenticated ? 'pop' : 'push',
            }}
          />
        ) : (
          <RootStack.Screen name="Main" component={MainStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const RootNavigator = () => {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
};

export default RootNavigator;
