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
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.brandText}>Roam Ceylon</Text>
          </View>
        </View>
      )}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      <View style={[styles.content, containerStyle]}>
        {children}
      </View>
    </View>
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
    marginBottom : 10,
  },
  welcomeText: {
    fontSize: 30,
    color: '#333',
    fontWeight: '400',
  },
  logo: {
    width: width * 0.6, // Adjust width as needed (e.g., 50% of screen width)
    height: width * 0.6, // Keep aspect ratio square-ish
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
  }
});
