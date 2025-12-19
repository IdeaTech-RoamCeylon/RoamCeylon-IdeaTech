import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components';
import { LoadingProvider } from './src/context/LoadingContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <LoadingProvider>
          <RootNavigator />
          <StatusBar style="auto" />
          <Toast />
        </LoadingProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
