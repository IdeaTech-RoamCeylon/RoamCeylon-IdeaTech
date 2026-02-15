import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image, Dimensions} from 'react-native';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  showLogo?: boolean;
}
const { width } = Dimensions.get('window');

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  title, 
  subtitle, 
  children,
  containerStyle,
  showLogo = true
}) => {
  return (
    <LinearGradient
          colors={['#c8f4df', '#dcf5e9', '#edf6f2']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.container}
        >
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
          />
        </View>
      )}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      <View style={[styles.content, containerStyle]}>
        {children}
      </View>
    </View>
    <Image source={require('../../assets/Skyline.png')} style={styles.skyline} />
  </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
 
  logoText: {
    fontSize: 40,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom : 0,
  },
  welcomeText: {
    fontSize: 30,
    color: '#333',
    fontWeight: '400',
  },
  logo: {
    width: width * 0.8, // Adjust width as needed (e.g., 50% of screen width)
    height: width * 0.8, // Keep aspect ratio square-ish
    resizeMode: 'contain',
    marginBottom: 0,
    alignSelf: 'flex-start',
  },
  brandText: {
    fontSize: 30,
    color: '#E6A4A4',
    fontWeight: '500',
  },
  title: {
    paddingTop: 0,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'left',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'left',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
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
