import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { showToast } from '../../utils/toast';
import { Input } from '../../components';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { nhost } from '../../config/nhostClient';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await nhost.auth.signInEmailPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const session = response.body?.session;
      if (!session?.accessToken) {
        throw new Error(
          (response.body as any)?.error?.message ||
          'Invalid email or password. Please try again.',
        );
      }

      await SecureStore.setItemAsync('authToken', session.accessToken);
      if (session.refreshToken) {
        await SecureStore.setItemAsync('nhostRefreshToken', session.refreshToken);
      }

      await login(session.accessToken);
      // RootNavigator will auto-navigate to Main when isAuthenticated becomes true
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error?.message || 'Invalid email or password. Please try again.';
      showToast.error(msg, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showToast.info('Password reset link will be sent to your email.', 'Forgot Password');
    // TODO: implement nhost.auth.resetPassword({ email }) when needed
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
          />
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSubText}>Sign in to continue</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formSubtitle}>Enter your credentials to access your account</Text>

          {/* Email */}
          <Input
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
            icon={<MaterialCommunityIcons name="email" size={22} color="#4A9B7F" />}
            error={errors.email}
            disabled={loading}
          />

          {/* Password */}
          <Input
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
            icon={<MaterialCommunityIcons name="lock" size={22} color="#4A9B7F" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#888"
                />
              </TouchableOpacity>
            }
            error={errors.password}
            disabled={loading}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInWrapper, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#16a669', '#b8e36f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
              {!loading && (
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => navigation.navigate('GoogleSignIn')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}> Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Skyline */}
        <Image
          source={require('../../../assets/Skyline.png')}
          style={styles.skyline}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 200,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  logo: {
    width: width * 0.22,
    height: width * 0.22,
    resizeMode: 'contain',
  },
  headerText: { marginLeft: 12 },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  welcomeSubText: {
    fontSize: 15,
    color: '#4A9B7F',
    fontWeight: '500',
    marginTop: 2,
  },
  formCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    shadowColor: '#16a669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0faf5',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 18,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: '#16a669',
    fontWeight: '600',
  },
  signInWrapper: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 6,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: { opacity: 0.6 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e8e8e8',
  },
  dividerText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 30,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  registerRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#555',
  },
  registerLink: {
    fontSize: 14,
    color: '#16a669',
    fontWeight: '700',
  },
  skyline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 180,
    resizeMode: 'stretch',
    opacity: 0.12,
  },
});

export default LoginScreen;
