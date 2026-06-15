import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { _width } = Dimensions.get('window');

const RegisterScreen = () => {
  const router = useRouter();

  // ── Form fields ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── UI state ───────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, _setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;

    // Navigate to partner screen with registration data
    router.push({
      pathname: '/patner',
      params: {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      },
    });
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
    autoCapitalize: any = 'words',
    textContentType: any = 'none'
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
            textContentType={textContentType}
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
          {/* Header / Hero Image - spans full bleed */}
          <View style={styles.heroContainer}>
            <Image 
              source={require('@/assets/images/registerscreen.png')} 
              style={styles.heroImage} 
              contentFit="cover"
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
                      textContentType="newPassword"
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
                          let barColor = '#F0F3F1'; // Default light gray
                          if (strength >= idx) {
                            if (strength <= 1) {
                              barColor = '#FF4D4D'; // Red
                            } else {
                              barColor = '#0E5E2F'; // Green matching Roam Ceylon branding
                            }
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
                          let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'check-circle-outline';

                          if (strength <= 1) {
                            msg = 'Weak password (try adding more characters)';
                            color = '#FF4D4D';
                            icon = 'alert-circle-outline';
                          } else if (strength === 2 || strength === 3) {
                            msg = 'Password looks promising';
                            color = '#0E5E2F';
                            icon = 'check-circle-outline';
                          } else if (strength === 4) {
                            msg = 'Strong and secure password!';
                            color = '#0E5E2F';
                            icon = 'check-circle';
                          }

                          return (
                            <>
                              <MaterialCommunityIcons 
                                name={icon} 
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
                  () => setShowConfirmPassword(!showConfirmPassword),
                  'default',
                  'none',
                  'oneTimeCode'
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
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>

              {/* Horizontal divider line */}
              <View style={styles.divider} />

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
    paddingBottom: 60,
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
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 25,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 1.2,
  },
});

export default RegisterScreen;
