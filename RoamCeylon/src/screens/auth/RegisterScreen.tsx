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
import { nhost } from '../../config/nhostClient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = typeof GENDERS[number];

const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  // ── Form fields ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [isLocal, setIsLocal] = useState<boolean | undefined>(undefined);
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
    if (isLocal === undefined) e.isLocal = 'Please select your visitor type';
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
      // Create account in Nhost Hasura Auth.
      // With "Require Verified Emails" enabled in Nhost, the user will
      // receive a verification link at their email address.
      // They cannot sign in until the email is verified.
      const signUpResponse = await nhost.auth.signUpEmailPassword({
        email: email.trim().toLowerCase(),
        password,
        options: {
          displayName: name.trim(),
          metadata: {
            phoneNumber: phoneNumber.trim(),
            birthday: birthday?.toISOString(),
            gender,
            isLocal,
          },
        },
      }) as any;

      // Check for signup errors returned by Nhost
      const authError = signUpResponse.error || signUpResponse.body?.error;
      if (authError) {
        throw new Error(
          authError.message || 'Registration failed. Please try again.',
        );
      }

      // Temporarily store the registration details locally so they can be synced
      // to the NestJS database when the user successfully logs in after verification.
      const tempData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        birthday: birthday?.toISOString(),
        gender,
        isLocal,
      };
      await SecureStore.setItemAsync('tempRegistrationData', JSON.stringify(tempData));

      // Navigate to the verification screen so the user knows
      // to check their inbox before logging in.
      navigation.navigate('EmailVerification', {
        email: email.trim().toLowerCase(),
      });

      showToast.success(
        'Please check your email to verify your account.',
        'Account Created',
      );
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
               <MaterialCommunityIcons 
                 name={iconName === 'shield-check-outline'
                   ? (showSecure ? 'shield-outline' : 'shield-check-outline')
                   : (showSecure ? 'lock-open-outline' : 'lock-outline')} 
                 size={20} 
                 color="#8F9B96" 
               />
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header / Hero Image - now spans full bleed */}
          <View style={styles.heroContainer}>
            <Image 
              source={require('../../assets/registerscreen.png')} 
              style={styles.heroImage} 
            />
          </View>

          {/* White Card overlapping the hero image */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              {/* Titles */}
              <Text style={styles.titleText}>Create an account</Text>
              <Text style={styles.subtitleText}>
                Start your journey through the Emerald Isle.
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
                  '+94 77 123 4567',
                  phoneNumber,
                  setPhoneNumber,
                  'phone-outline',
                  'phoneNumber',
                  false,
                  false,
                  undefined,
                  'phone-pad'
                )}

                {/* BIRTHDAY and GENDER row */}
                <View style={styles.row}>
                  {/* Birthday Section */}
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>BIRTHDAY</Text>
                    <TouchableOpacity
                      style={[styles.inputWrapper, errors.birthday ? styles.inputError : null]}
                      onPress={() => { setShowDatePicker(true); setErrors((e) => ({ ...e, birthday: '' })); }}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text 
                        numberOfLines={1} 
                        style={[styles.birthdayText, !birthday && styles.placeholderText]}
                      >
                        {birthday ? formatDate(birthday) : 'MM/DD/YYYY'}
                      </Text>
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#8F9B96" />
                      </View>
                    </TouchableOpacity>
                    {errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}
                  </View>

                  {/* Gender Section */}
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>GENDER</Text>
                    <View style={[styles.genderContainer, errors.gender ? styles.inputError : null]}>
                      {GENDERS.map((option) => {
                        const isActive = gender === option;
                        let displayLabel = 'M';
                        if (option === 'Female') displayLabel = 'F';
                        else if (option === 'Other') displayLabel = 'O';

                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.genderOptionBtn,
                              isActive ? styles.genderOptionBtnActive : null,
                            ]}
                            onPress={() => { setGender(option); setErrors((e) => ({ ...e, gender: '' })); }}
                            disabled={loading}
                            activeOpacity={0.8}
                          >
                            <Text style={[
                              styles.genderOptionText,
                              isActive ? styles.genderOptionTextActive : null
                            ]}>
                              {displayLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                  </View>
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

                {/* Visitor Type ("I AM A") */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>I AM A</Text>
                  <View style={styles.visitorRow}>
                    {([
                      { label: 'Local', value: true, icon: 'earth' },
                      { label: 'Foreigner', value: false, icon: 'airplane' }
                    ] as const).map(({ label, value, icon }) => {
                      const isActive = isLocal === value;
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.visitorBtn,
                            isActive ? styles.visitorBtnActive : styles.visitorBtnInactive,
                          ]}
                          onPress={() => { setIsLocal(value); setErrors((e) => ({ ...e, isLocal: '' })); }}
                          disabled={loading}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons 
                            name={icon} 
                            size={20} 
                            color={isActive ? '#0E5E2F' : '#494034'} 
                            style={styles.visitorIcon} 
                          />
                          <Text style={[
                            styles.visitorBtnText,
                            isActive ? styles.visitorBtnTextActive : styles.visitorBtnTextInactive,
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.isLocal ? <Text style={styles.errorText}>{errors.isLocal}</Text> : null}
                </View>

                {/* Password field with strength bars */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••••••"
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
                        name={showPassword ? 'lock-open-outline' : 'lock-outline'} 
                        size={20} 
                        color="#8F9B96" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                  {/* Dynamic Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4].map(idx => {
                          let barColor = '#E0E0E0';
                          if (strength >= idx) {
                            if (strength === 1) barColor = '#FF4D4D'; // Red
                            else if (strength === 2) barColor = '#FF944D'; // Orange
                            else if (strength === 3) barColor = '#FFD700'; // Yellow
                            else if (strength === 4) barColor = '#34C759'; // Green
                          }
                          return (
                            <View 
                              key={idx} 
                              style={[styles.strengthBar, { backgroundColor: barColor }]} 
                            />
                          );
                        })}
                      </View>
                      <View style={styles.strengthTextRow}>
                        {(() => {
                          let msg = '';
                          let color = '#9E9E9E';
                          let icon = 'check-circle-outline';

                          if (strength <= 1) {
                            msg = 'Weak password (try adding more characters)';
                            color = '#FF4D4D';
                            icon = 'alert-circle-outline';
                          } else if (strength === 2) {
                            msg = 'Fair password (add numbers or uppercase)';
                            color = '#FF944D';
                            icon = 'alert-circle-outline';
                          } else if (strength === 3) {
                            msg = 'Password looks promising';
                            color = '#FFD700';
                            icon = 'check-circle-outline';
                          } else if (strength === 4) {
                            msg = 'Strong and secure password!';
                            color = '#34C759';
                            icon = 'check-circle';
                          }

                          return (
                            <>
                              <MaterialCommunityIcons 
                                name={icon as any} 
                                size={14} 
                                color={color} 
                              />
                              <Text style={[styles.strengthText, { color }]}>
                                {msg}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  )}
                </View>

                {/* Confirm Password field */}
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

              {/* Innovated By Footer */}
              <Text style={styles.footerText}>
                INNOVATED BY ROAM CEYLON
              </Text>

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
    backgroundColor: '#ffffff', 
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 160,
    paddingHorizontal: 0,
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  heroContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  logoImage: {
    width: width * 0.7,
    height: width * 0.35,
    resizeMode: 'contain',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 30,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  subtitleText: {
    fontSize: 16,
    color: '#494034',
    marginTop: 6,
    lineHeight: 22,
  },
  formGroup: {
    marginTop: 25,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfCol: {
    width: '48%',
  },
  birthdayText: {
    fontSize: 15,
    color: '#494034',
    flex: 1,
  },
  placeholderText: {
    color: '#B5C0BC',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 58,
    borderWidth: 1,
    borderColor: '#D8E5E0',
    padding: 4,
  },
  genderOptionBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  genderOptionBtnActive: {
    backgroundColor: '#9CEEA4',
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#494034',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
  visitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  visitorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
  },
  visitorBtnActive: {
    backgroundColor: '#9CEEA4',
    borderColor: '#9CEEA4',
  },
  visitorBtnInactive: {
    backgroundColor: '#F1F4F9',
    borderColor: '#E2ECE9',
  },
  visitorBtnText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  visitorBtnTextActive: {
    color: '#0E5E2F',
  },
  visitorBtnTextInactive: {
    color: '#494034',
  },
  visitorIcon: {
    marginRight: 2,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  registerButtonWrapper: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButton: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
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
    fontSize: 15,
    color: '#494034',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1.2,
  },
});

export default RegisterScreen;
