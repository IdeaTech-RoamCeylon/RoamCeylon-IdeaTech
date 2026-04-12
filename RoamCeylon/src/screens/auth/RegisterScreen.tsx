import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { nhost } from '../../config/nhostClient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = typeof GENDERS[number];

const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { login, refreshUser } = useAuth();

  // ── Form fields ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength(password);

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
    if (!birthday) e.birthday = 'Birthday is required';
    if (!gender) e.gender = 'Please select a gender';
    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 9) {
      e.password = 'Password must be at least 9 characters';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

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

      // Step 4: Save required profile parts to NestJS backend
      await updateProfile(
        name.trim(),
        email.trim().toLowerCase(),
        birthday,
        gender,
      );
      await refreshUser();

      showToast.success('Welcome to RoamCeylon! 🎉', 'Account Created');
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

  // ── Render Helpers ─────────────────────────────────────────
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
          {isSecure && onToggleSecure ? (
             <TouchableOpacity style={styles.iconContainer} onPress={onToggleSecure}>
               <MaterialCommunityIcons name={showSecure ? 'eye-off-outline' : iconName} size={20} color="#9E9E9E" />
             </TouchableOpacity>
          ) : (
             <View style={styles.iconContainer}>
               <MaterialCommunityIcons name={iconName} size={20} color="#9E9E9E" />
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
          <View style={styles.card}>
            {/* Header / Hero Image */}
            <View style={styles.heroContainer}>
              <Image 
                source={require('../../assets/RegisterScreenPic.png')} 
                style={styles.heroImage} 
              />
              <LinearGradient
                colors={['transparent', '#ffffff']}
                style={styles.heroGradient}
              />
            </View>

            <View style={styles.contentContainer}>
              {/* Titles */}
              <Text style={styles.brandText}>Roam Ceylon</Text>
              
              <Text style={styles.titleText}>Create an account</Text>
              <Text style={styles.subtitleText}>
                Start your journey through the{'\n'}Emerald Isle.
              </Text>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                {renderInputCard(
                  'FULL NAME',
                  'Ariyan Perera',
                  name,
                  setName,
                  'account-outline',
                  'name',
                  false,
                  false,
                  undefined,
                  'default',
                  'words'
                )}

                {renderInputCard(
                  'EMAIL ADDRESS',
                  'hello@roamceylon.lk',
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

                {renderInputCard(
                  'PHONE NUMBER',
                  '07X XXX XXXX',
                  phoneNumber,
                  setPhoneNumber,
                  'phone-outline',
                  'phoneNumber',
                  false,
                  false,
                  undefined,
                  'phone-pad'
                )}

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>BIRTHDAY</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, errors.birthday ? styles.inputError : null]}
                    onPress={() => { setShowDatePicker(true); setErrors((e) => ({ ...e, birthday: '' })); }}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.textInput, !birthday && { color: '#C4C4C4', paddingTop: 16 }]}>
                      {birthday ? formatDate(birthday) : 'Select your birthday'}
                    </Text>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#9E9E9E" />
                    </View>
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

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <View style={styles.genderButtonsContainer}>
                    {GENDERS.map((option) => {
                      const isActive = gender === option;
                      let iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"] = 'gender-non-binary';
                      if (option === 'Male') iconName = 'gender-male';
                      else if (option === 'Female') iconName = 'gender-female';

                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.genderBtnNew,
                            isActive ? styles.genderBtnActiveNew : styles.genderBtnInactiveNew,
                          ]}
                          onPress={() => { setGender(option); setErrors((e) => ({ ...e, gender: '' })); }}
                          disabled={loading}
                        >
                          <MaterialCommunityIcons 
                            name={iconName} 
                            size={18} 
                            color={isActive ? '#075A1A' : '#494034'} 
                            style={{ marginRight: 6 }} 
                          />
                          <Text style={[
                            styles.genderBtnTextNew, 
                            isActive ? styles.genderBtnTextActiveNew : styles.genderBtnTextInactiveNew
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••••••"
                      placeholderTextColor="#C4C4C4"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (errors.password) setErrors((e) => ({ ...e, password: '' }));
                      }}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity style={styles.iconContainer} onPress={() => setShowPassword(!showPassword)}>
                      <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'lock-outline'} size={20} color="#9E9E9E" />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4].map(idx => (
                          <View 
                            key={idx} 
                            style={[
                              styles.strengthBar, 
                              strength >= idx ? styles.activeStrengthBar : null
                            ]} 
                          />
                        ))}
                      </View>
                      <View style={styles.strengthTextRow}>
                        <MaterialCommunityIcons 
                          name="check-circle" 
                          size={14} 
                          color={strength >= 2 ? '#34C759' : '#9E9E9E'} 
                        />
                        <Text style={[styles.strengthText, strength >= 2 && styles.activeStrengthText]}>
                          Password looks promising
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {renderInputCard(
                  'CONFIRM PASSWORD',
                  '••••••••••••',
                  confirmPassword,
                  setConfirmPassword,
                  'shield-check-outline',
                  'confirmPassword',
                  true,
                  showConfirmPassword,
                  () => setShowConfirmPassword(!showConfirmPassword)
                )}

              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButtonWrapper, loading && styles.disabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFDF59', '#FFC83C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Creating...' : 'Register Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageBackground: { 
    flex: 1, 
    backgroundColor: '#EAF4EF', 
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 200, // Massive bottom padding to accommodate any keyboard pushing
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  heroContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#e6e6e6',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#494034',
    marginBottom: 20,
    marginTop: -28,
    zIndex: 1,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 38,
  },
  subtitleText: {
    fontSize: 15,
    color: '#666666',
    marginTop: 6,
    lineHeight: 22,
  },
  formGroup: {
    marginTop: 35,
    gap: 20,
  },
  inputSection: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#494034',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
  genderButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    height: 54,
  },
  genderBtnNew: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  genderBtnActiveNew: {
    backgroundColor: '#95F28A',
    borderColor: '#95F28A',
  },
  genderBtnInactiveNew: {
    backgroundColor: '#FFFFFF',
    borderColor: '#494034',
  },
  genderBtnTextNew: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderBtnTextActiveNew: {
    color: '#075A1A',
  },
  genderBtnTextInactiveNew: {
    color: '#494034',
  },
  strengthContainer: {
    marginTop: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  activeStrengthBar: {
    backgroundColor: '#34C759',
  },
  strengthTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  strengthText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  activeStrengthText: {
    color: '#34C759',
  },
  registerButtonWrapper: {
    marginTop: 35,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FFD23F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9E7F47',
  },
});

export default RegisterScreen;
