import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components';
import { LoadingProvider } from './src/context/LoadingContext';
import { PlannerProvider } from './src/context/PlannerContext';
import { MapProvider } from './src/context/MapContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <LoadingProvider>
          <PlannerProvider>
            <MapProvider>
              <RootNavigator />
              <StatusBar style="auto" />
              <Toast />
            </MapProvider>
          </PlannerProvider>
        </LoadingProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
