import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Get screen dimensions to help with sizing
const { width } = Dimensions.get('window');

const SplashScreen = () => {
  // No navigation needed as there is no button

  return (
    <LinearGradient
      // Approximate colors from the image's gradient
      colors={['#b3f5d5', '#fff25f']}
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
      </View>

      {/* Replace require(...) with the path to your actual skyline image */}
      {/*<Image
        source={require('./assets/skyline.png')} // Placeholder for the bottom skyline
        style={styles.skyline}
      />*/}
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
    width: width * 0.5, // Adjust width as needed (e.g., 50% of screen width)
    height: width * 0.5, // Keep aspect ratio square-ish
    resizeMode: 'contain',
    marginBottom: 20,
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
    opacity: 0.8, // Optional: to blend it slightly with the background
  },
});

export default SplashScreen;