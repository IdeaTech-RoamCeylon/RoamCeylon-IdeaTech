import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.text}>🌴 RoamCeylon</Text>
        <Text style={styles.subtitle}>App is loading...</Text>
      </View>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
});
