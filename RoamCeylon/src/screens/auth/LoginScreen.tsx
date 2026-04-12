import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
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
  };

  const renderInputCard = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    iconName: keyof typeof MaterialCommunityIcons.glyphMap,
    errorKey: string,
    isSecure?: boolean,
    showSecure?: boolean,
    onToggleSecure?: () => void,
    keyboardType: any = 'default',
    autoCapitalize: any = 'words'
  ) => {
    return (
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputWrapper, errors[errorKey] ? styles.inputError : null]}>
          <MaterialCommunityIcons name={iconName} size={20} color="#9E9E9E" style={styles.leftIcon} />
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#C4C4C4"
            value={value}
            onChangeText={(t) => {
              onChangeText(t);
              if (errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: '' }));
            }}
            secureTextEntry={isSecure && !showSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={!loading}
          />
          {isSecure && onToggleSecure && (
             <TouchableOpacity style={styles.rightIconContainer} onPress={onToggleSecure}>
               <MaterialCommunityIcons name={showSecure ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9E9E9E" />
             </TouchableOpacity>
          )}
        </View>
        {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.pageBackground}>
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
          {/* Header section */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="earth" size={32} color="#075A1A" />
              <View style={styles.magnifyOverlay}>
                <MaterialCommunityIcons name="magnify" size={16} color="#075A1A" />
              </View>
            </View>
            <Text style={styles.brandText}>Roam Ceylon</Text>
            <Text style={styles.welcomeSubText}>Welcome back, traveler!</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.formGroup}>
              {/* Email */}
              {renderInputCard(
                'EMAIL ADDRESS',
                'explorer@island.com',
                email,
                setEmail,
                'email-outline',
                'email',
                false,
                false,
                undefined,
                'email-address',
                'none'
              )}

              {/* Password */}
              {renderInputCard(
                'PASSWORD',
                '••••••••',
                password,
                setPassword,
                'lock-outline',
                'password',
                true,
                showPassword,
                () => setShowPassword(!showPassword)
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
              style={[styles.signInWrapper, loading && styles.disabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFDF59', '#FFC83C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                <Text style={styles.signInButtonText}>
                  {loading ? 'Logging in...' : 'Log in'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR EXPLORE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Options - Google Only */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => navigation.navigate('GoogleSignIn')}
              activeOpacity={0.85}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                style={styles.googleIcon} 
              />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New to the island? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Start your journey</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageBackground: { 
    flex: 1, 
    backgroundColor: '#F9F9F9', // Subtle off-white to match the design bg
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#95F28A',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  magnifyOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 10,
    backgroundColor: '#95F28A',
    borderRadius: 8,
  },
  brandText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  welcomeSubText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 6,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  formGroup: {
    gap: 20,
  },
  inputSection: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#554A3B', // Brownish gray matching design
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  rightIconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 15,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    color: '#135029', // Dark green like the image
    fontWeight: '700',
  },
  signInWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FFD23F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  signInButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 15,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 14,
    width: '50%',
    alignSelf: 'center',
    height: 50,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#494034',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: 15,
    color: '#666666',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9E7F47',
  },
});

export default LoginScreen;
