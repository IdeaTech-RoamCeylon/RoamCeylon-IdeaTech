import React from 'react';
import { View, Text,Image,StyleSheet, TouchableOpacity, Dimensions, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {MaterialCommunityIcons} from '@expo/vector-icons';

// Add AuthButton component
interface AuthButtonProps {
  onPress: () => void;
  text: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const AuthButton: React.FC<AuthButtonProps> = ({ onPress, text,iconName }) => {
  return (
    <LinearGradient
          colors={['#16a669', '#b8e36f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <MaterialCommunityIcons name={iconName} size={20} weight ="bold" color="#ffffff" />
          <Text style={styles.buttonText}>{text}</Text>
        </TouchableOpacity>
    </LinearGradient>
  );
};
const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={[ '#a0face', '#bbf5d9','#d8f19e','#efea70','#efea70']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Image
          source={require('../../../assets/Roam Ceylon Logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to RoamCeylon</Text>
        <Text style={styles.description}>
          Your ultimate guide to exploring the beautiful island of Sri Lanka
        </Text>
        <View style={styles.buttonGroup}>
          <AuthButton
            onPress={() => navigation.navigate('PhoneEntry' as never)}
            text="Continue with Phone"
            iconName="phone"
          />
          <AuthButton
            onPress={() => navigation.navigate('GoogleSignIn' as never)}
            text="Continue with Google"
            iconName="google"
          />
        </View>
      </View>
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
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 30,
    marginVertical: 5,
    shadowColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonGradient: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonGroup: {
    marginTop: 0, // increase to move buttons lower
  },
  logo: {
    width: width * 0.6, // Adjust width as needed (e.g., 50% of screen width)
    height: width * 0.6, // Keep aspect ratio square-ish
    resizeMode: 'contain',
    marginBottom: 0,
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

export default WelcomeScreen;
