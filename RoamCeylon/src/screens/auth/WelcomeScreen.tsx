import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

interface AuthButtonProps {
  onPress: () => void;
  text: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  colors?: string[];
}

const AuthButton: React.FC<AuthButtonProps> = ({
  onPress,
  text,
  iconName,
  colors = ['#16a669', '#b8e36f'],
}) => {
  return (
    <LinearGradient
      colors={colors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.buttonGradient}
    >
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
        <MaterialCommunityIcons name={iconName} size={20} color="#ffffff" />
        <Text style={styles.buttonText}>{text}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const GoogleButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.googleButton} onPress={onPress} activeOpacity={0.85}>
    <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
    <Text style={styles.googleButtonText}>Continue with Google</Text>
  </TouchableOpacity>
);

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  return (
    <View style={styles.container}>
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
            onPress={() => navigation.navigate('Register' as never)}
            text="Create Account"
            iconName="account-plus"
          />
          <AuthButton
            onPress={() => navigation.navigate('Login' as never)}
            text="Sign In with Email"
            iconName="email"
            colors={['#0f7a50', '#14a065']}
          />
          <GoogleButton onPress={() => navigation.navigate('GoogleSignIn' as never)} />
        </View>
      </View>
      <Image
        source={require('../../../assets/Skyline.png')}
        style={styles.skyline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 130,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 44,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 30,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    minWidth: 190,
    textAlign: 'center',
  },
  buttonGradient: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 6,
    width: width * 0.78,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fafafa',
    width: width * 0.78,
    marginVertical: 6,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  buttonGroup: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.58,
    height: width * 0.58,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  skyline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 250,
    resizeMode: 'stretch',
    opacity: 0.2,
  },
});

export default WelcomeScreen;
