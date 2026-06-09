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
  Dimensions,
  BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '@/config/nhostClient';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();

  // Exit app on back button press on Login Screen (Android)
  useEffect(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true; // prevent default behavior (navigation back)
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, []);

  // Nhost appends type=emailConfirmation to the redirect URL after email verification
  useEffect(() => {
    if (type === 'emailConfirmation') {
      setTimeout(() => {
        showToast.success(
          'Your email has been verified! You can now log in.',
          'Email Verified ✓',
        );
      }, 500);
    }
  }, [type]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      // Build sync payload from the Nhost session (primary source)
      // Fall back to SecureStore temp data for anything not in the session
      const nhostUser = (session as any).user;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      let syncPayload: Record<string, string> = {
        email: nhostUser?.email || email.trim().toLowerCase(),
        name: nhostUser?.displayName || '',
        phoneNumber: nhostUser?.metadata?.phoneNumber || '',
        role: nhostUser?.metadata?.role || '',
      };

      // Merge with SecureStore temp data (may have phone/role if metadata wasn't set)
      try {
        const tempDataStr = await SecureStore.getItemAsync('tempAdminRegistrationData');
        if (tempDataStr) {
          const tempData = JSON.parse(tempDataStr) as Record<string, string>;
          // Only override if session metadata is empty
          if (!syncPayload.phoneNumber && tempData.phoneNumber) syncPayload.phoneNumber = tempData.phoneNumber;
          if (!syncPayload.role && tempData.role) syncPayload.role = tempData.role;
          if (!syncPayload.name && tempData.name) syncPayload.name = tempData.name;
          await SecureStore.deleteItemAsync('tempAdminRegistrationData');
        }
      } catch (storeErr) {
        console.warn('SecureStore read failed (non-critical):', storeErr);
      }

      console.log('[AdminSync] Syncing to backend with payload:', JSON.stringify(syncPayload));
      console.log('[AdminSync] API URL:', apiUrl);

      // Sync to backend — non-fatal; wrap in its own try/catch so a network
      // error (backend unreachable, no Wi-Fi, etc.) doesn't break the login flow.
      try {
        const syncRes = await fetch(`${apiUrl}/admin-users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(syncPayload),
        });

        if (!syncRes.ok) {
          const syncError = await syncRes.text().catch(() => 'unknown error');
          console.error('[AdminSync] Sync failed:', syncRes.status, syncError);
        } else {
          console.log('[AdminSync] Sync successful:', syncRes.status);
        }
      } catch (syncErr) {
        console.warn('[AdminSync] Network error during sync (non-fatal):', syncErr);
      }

      // Navigate to the role-based screen
      const userRole = syncPayload.role || nhostUser?.metadata?.role || '';
      if (userRole === 'activity_provider' || userRole === 'activity_manager') {
        router.replace('/activities/home' as any);
      } else if (userRole === 'hotel_manager') {
        router.replace('/booking/home' as any);
      } else if (userRole === 'tour_guide') {
        router.replace('/tour-guide/home' as any);
      } else if (userRole === 'shop_partner') {
        router.replace('/shopping/home' as any);
      } else {
        router.replace('/home');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      const msg =
        error?.message ||
        (error?.body as any)?.error?.message ||
        'Invalid email or password. Please try again.';

      // Detect unverified email
      const isUnverified =
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('unverified') ||
         msg.toLowerCase().includes('email is not verified') ||
         msg.toLowerCase().includes('verify'));

      if (isUnverified) {
        showToast.info(
          'Please verify your email before logging in.',
          'Email Not Verified',
        );
        router.push({
          pathname: '/emailVerification',
          params: { email: email.trim().toLowerCase() },
        });
      } else {
        showToast.error(msg, 'Login Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/passwordReset');
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
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#B5C0BC"
            value={value}
            onChangeText={(t) => {
              onChangeText(t);
              if (errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: '' }));
            }}
            secureTextEntry={isSecure && !showSecure}
            keyboardType={isSecure ? 'default' : keyboardType}
            autoCapitalize={isSecure ? 'none' : autoCapitalize}
            editable={!loading}
          />
          {isSecure && onToggleSecure ? (
             <TouchableOpacity style={styles.iconContainer} onPress={onToggleSecure}>
               <MaterialCommunityIcons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8F9B96" />
             </TouchableOpacity>
          ) : (
             <View style={styles.iconContainer}>
               <MaterialCommunityIcons name={iconName} size={20} color="#8F9B96" />
             </View>
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
          {/* Header section with Logo and Titles */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/images/loginscreen.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={styles.titleText}>Welcome back!</Text>
            <Text style={styles.subtitleText}>The Emerald Isle awaits your return.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              <View style={styles.formGroup}>
                {/* Email */}
                {renderInputCard(
                  'EMAIL ADDRESS',
                  'partner@roamceylon.com',
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

                {/* Password field with inline Forgot Password */}
                <View style={styles.inputSection}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#B5C0BC"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (errors.password) setErrors((e) => ({ ...e, password: '' }));
                      }}
                      secureTextEntry={!showPassword}
                      keyboardType="default"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                    <TouchableOpacity style={styles.iconContainer} onPress={() => setShowPassword(!showPassword)}>
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#8F9B96"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>
              </View>

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
                    {loading ? 'Logging in...' : 'Log In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR EXPLORE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => router.push('/googleSignIn')}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>New to the expedition? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.registerLink}>Create account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Secure Portal Badge & Innovated by Ideatech */}
          <View style={styles.footerContainer}>
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#0E5E2F" />
              <Text style={styles.badgeText}>SECURE PORTAL ACTIVE</Text>
            </View>
            <Text style={styles.footerText}>
              INNOVATED BY IDEATECH
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    flexGrow: 1,
    backgroundColor: '#F6FAF6',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 25,
    backgroundColor: '#F6FAF6',
    width: '100%',
  },
  logoImage: {
    width: width * 1.0,
    height: width * 0.4,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0E5E2F',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#494034',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 30,
  },
  formGroup: {
    gap: 16,
  },
  inputSection: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#494034',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5E2F',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D8E5E0',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#494034',
    height: '100%',
  },
  iconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  signInWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 25,
  },
  signInButton: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E5E0',
    width: '100%',
    height: 58,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    fontSize: 15,
    color: '#494034',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 30,
    paddingBottom: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5E2F',
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});

export default LoginScreen;
