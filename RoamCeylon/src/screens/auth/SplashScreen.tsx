import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';



// Get screen dimensions to help with sizing
const { width } = Dimensions.get('window');

const SplashScreen = () => {
  // No navigation needed as there is no button
  const navigation = useNavigation();
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);
  return (
    <LinearGradient
      // Approximate colors from the image's gradient
      colors={[ '#a0face', '#bbf5d9','#d8f19e','#efea70','#efea70']}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {/* Replace require(...) with the path to your actual logo image */}
        <Image
          source={require('../../../assets/Roam Ceylon Logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Roam Ceylon</Text>
        <Text style={styles.subtitle}>Unlock the Wonders of Sri Lanka</Text>
        
          <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Welcome' as never)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#16a669', '#b8e36f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Replace require(...) with the path to your actual skyline image */}
      {<Image
        source={require('../../../assets/Skyline.png')} // Placeholder for the bottom skyline
        style={styles.skyline}
      />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Ensure elements are positioned correctly relative to the container
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Add some padding to push content up from the bottom skyline
    paddingBottom: 100,
  },
  logo: {
    width: width * 0.8, // Adjust width as needed (e.g., 50% of screen width)
    height: width * 0.8, // Keep aspect ratio square-ish
    resizeMode: 'contain',
    marginBottom: 5,
  },
  button: {
    paddingHorizontal: 40,
    marginTop: 20,
    paddingVertical: 15,
    
    borderRadius: 25,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    // A dark teal color sampled from the text in the image
    color: '#1B7F6B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    // A slightly darker, grayish-teal color
    color: '#3E5047',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  skyline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 250, // Adjust height based on your actual image's aspect ratio
    resizeMode: 'stretch', // or 'cover' depending on the image asset
    opacity: 0.2, // Optional: to blend it slightly with the background
  },
});

export default SplashScreen;