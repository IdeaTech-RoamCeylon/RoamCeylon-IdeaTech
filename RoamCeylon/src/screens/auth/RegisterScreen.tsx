import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { showToast } from '../../utils/toast';
import { Input } from '../../components';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { nhost } from '../../config/nhostClient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = typeof GENDERS[number];

const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { login, refreshUser } = useAuth();

  // ── Form fields ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);

  // ── UI state ───────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthday(selectedDate);
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) {
      e.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = 'Please enter a valid email';
    }
    if (!phoneNumber.trim()) {
      e.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 10) {
      e.phoneNumber = 'Please enter a valid phone number';
    }
    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (!birthday) e.birthday = 'Birthday is required';
    if (!gender) e.gender = 'Please select a gender';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Step 1: Create account in Nhost Hasura Auth.
      await nhost.auth.signUpEmailPassword({
        email: email.trim().toLowerCase(),
        password,
        options: {
          displayName: name.trim(),
          metadata: { phoneNumber: phoneNumber.trim() },
        },
      });

      // Step 2: Immediately sign in to get an access token.
      const signInResponse = await nhost.auth.signInEmailPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const session = signInResponse.body?.session;
      if (!session?.accessToken) {
        throw new Error(
          'Account created but sign-in failed. Please try logging in manually.',
        );
      }

      // Step 3: Persist tokens & notify AuthContext.
      await SecureStore.setItemAsync('authToken', session.accessToken);
      if (session.refreshToken) {
        await SecureStore.setItemAsync('nhostRefreshToken', session.refreshToken);
      }
      await login(session.accessToken);

      // Step 4: Save full profile (name, email, phone, birthday, gender)
      // to the NestJS backend so isProfileComplete becomes true.
      await updateProfile(
        name.trim(),
        email.trim().toLowerCase(),
        birthday,
        gender,
      );
      await refreshUser();

      showToast.success('Welcome to RoamCeylon! 🎉', 'Account Created');
      // RootNavigator will auto-navigate to MainStack when isProfileComplete is true.
    } catch (error: any) {
      console.error('Registration error:', error);
      showToast.error(
        error?.message || 'Registration failed. Please try again.',
        'Registration Failed',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
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
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
          />
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.welcomeSubText}>Join RoamCeylon</Text>
          </View>
        </View>

        {/* ── Form Card ──────────────────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Your Details</Text>
          <Text style={styles.formSubtitle}>Fill in your information to get started</Text>

          {/* Full Name */}
          <Input
            placeholder="Full Name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
            icon={<MaterialCommunityIcons name="account" size={22} color="#4A9B7F" />}
            error={errors.name}
            disabled={loading}
          />

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

          {/* Phone */}
          <Input
            placeholder="Phone Number (07X XXX XXXX)"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(t) => { setPhoneNumber(t); setErrors((e) => ({ ...e, phoneNumber: '' })); }}
            icon={<MaterialCommunityIcons name="phone" size={22} color="#4A9B7F" />}
            error={errors.phoneNumber}
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
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
              </TouchableOpacity>
            }
            error={errors.password}
            disabled={loading}
          />

          {/* Confirm Password */}
          <Input
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
            icon={<MaterialCommunityIcons name="lock-check" size={22} color="#4A9B7F" />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
              </TouchableOpacity>
            }
            error={errors.confirmPassword}
            disabled={loading}
          />

          {/* ── Birthday ──────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <TouchableOpacity
              style={[styles.dateButton, errors.birthday ? styles.fieldError : null]}
              onPress={() => { setShowDatePicker(true); setErrors((e) => ({ ...e, birthday: '' })); }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cake-variant" size={22} color="#4A9B7F" style={styles.fieldIcon} />
              <Text style={[styles.fieldText, !birthday && styles.fieldPlaceholder]}>
                {birthday ? formatDate(birthday) : 'Birthday'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#bbb" />
            </TouchableOpacity>
            {errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={birthday || new Date(2000, 0, 1)}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* ── Gender ────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <View style={[styles.genderWrapper, errors.gender ? styles.fieldError : null]}>
              <MaterialCommunityIcons name="gender-male-female" size={22} color="#4A9B7F" style={styles.fieldIcon} />
              <View style={styles.genderButtons}>
                {GENDERS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderBtn,
                      gender === option && styles.genderBtnActive,
                    ]}
                    onPress={() => { setGender(option); setErrors((e) => ({ ...e, gender: '' })); }}
                    disabled={loading}
                  >
                    <Text style={[styles.genderBtnText, gender === option && styles.genderBtnTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
          </View>

          {/* ── Register Button ───────────────────────────────── */}
          <TouchableOpacity
            style={[styles.registerButtonWrapper, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#16a669', '#b8e36f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButton}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
              {!loading && (
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* ── Login Link ─────────────────────────────────────── */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Skyline decoration */}
        <Image source={require('../../../assets/Skyline.png')} style={styles.skyline} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: {
    paddingBottom: 220,
    alignItems: 'center',
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
  welcomeText: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  welcomeSubText: { fontSize: 15, color: '#4A9B7F', fontWeight: '500', marginTop: 2 },

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
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: '#888', marginBottom: 18 },

  // ── Birthday ────────────────────────────────────────────────
  fieldGroup: { width: '100%', marginBottom: 10, alignItems: 'center' },
  dateButton: {
    width: width * 0.8,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: { marginRight: 10 },
  fieldText: { flex: 1, fontSize: 16, color: '#333' },
  fieldPlaceholder: { color: '#999' },
  fieldError: { borderColor: '#dc3545', borderWidth: 2 },
  errorText: { color: '#dc3545', fontSize: 12, marginTop: 4, alignSelf: 'flex-start', marginLeft: width * 0.1 },

  // ── Gender ──────────────────────────────────────────────────
  genderWrapper: {
    width: width * 0.8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderButtons: { flexDirection: 'row', flex: 1, gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#16a669', borderColor: '#16a669' },
  genderBtnText: { fontSize: 13, color: '#666', fontWeight: '500' },
  genderBtnTextActive: { color: '#fff', fontWeight: '700' },

  // ── Buttons ─────────────────────────────────────────────────
  registerButtonWrapper: { width: '100%', marginTop: 14, borderRadius: 30, overflow: 'hidden' },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  disabled: { opacity: 0.6 },

  // ── Footer ──────────────────────────────────────────────────
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 10,
  },
  termsLink: { color: '#16a669', fontWeight: '600', textDecorationLine: 'underline' },
  loginRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  loginText: { fontSize: 14, color: '#555' },
  loginLink: { fontSize: 14, color: '#16a669', fontWeight: '700' },
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

export default RegisterScreen;
