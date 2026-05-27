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
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { showToast } from '../../utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '../../config/nhostClient';

const { width } = Dimensions.get('window');

type EnterNewPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'EnterNewPassword'>;

const EnterNewPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<EnterNewPasswordScreenRouteProp>();
  const refreshToken = route.params?.refreshToken;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

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

  const validate = (): boolean => {
    const e: Record<string, string> = {};

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

  const handleChangePassword = async () => {
    if (!validate()) return;

    if (!refreshToken) {
      showToast.error(
        'Password reset link is invalid or expired. Please request a new one.',
        'Invalid Link'
      );
      return;
    }

    // Build the Nhost auth base URL from env vars
    const subdomain = process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN;
    const region = process.env.EXPO_PUBLIC_NHOST_REGION;
    const authBaseUrl = `https://${subdomain}.auth.${region}.nhost.run/v1`;

    setLoading(true);
    try {
      // Step 1: Exchange refreshToken for an access token via Nhost REST API
      const tokenRes = await fetch(`${authBaseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.accessToken) {
        throw new Error(tokenData?.message || 'Reset link is invalid or expired. Please request a new one.');
      }

      const accessToken = tokenData.accessToken;

      // Step 2: Change the password using the access token as Bearer auth
      const pwRes = await fetch(`${authBaseUrl}/user/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPassword: password }),
      });

      if (!pwRes.ok) {
        const pwData = await pwRes.json().catch(() => ({}));
        throw new Error(pwData?.message || 'Failed to update password. Please try again.');
      }

      showToast.success('Your password has been successfully updated.', 'Password Changed');
      navigation.navigate('Login');
    } catch (err: any) {
      console.error('Change password error:', err);
      showToast.error(
        err?.message || 'Failed to change password. Please request a new link.',
        'Reset Failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.pageBackground}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card */}
          <View style={styles.card}>
            {/* Soft Green Gradient/Blob in top-right corner */}
            <LinearGradient
              colors={['rgba(149, 242, 138, 0.25)', 'rgba(149, 242, 138, 0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.greenBlob}
            />

            {/* Header */}
            <Text style={styles.titleText}>Enter New Password</Text>
            <Text style={styles.subtitleText}>
              Please enter your new password below. Make sure it is at least 9 characters long.
            </Text>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {/* Password Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
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
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.iconContainer} onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9E9E9E" />
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

              {/* Confirm Password Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#C4C4C4"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: '' }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.iconContainer} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButtonWrapper, loading && styles.disabled]}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFDF59', '#FFC83C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Text>
              </LinearGradient>
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
    backgroundColor: '#F9F9F9',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 140,
    paddingHorizontal: 24,
    flexGrow: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 45,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  greenBlob: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    borderTopRightRadius: 40,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#706B63',
    fontWeight: '400',
    marginBottom: 35,
  },
  formGroup: {
    width: '100%',
    marginBottom: 30,
    gap: 20,
  },
  inputSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A2693F',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
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
    marginTop: 6,
    paddingLeft: 4,
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
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default EnterNewPasswordScreen;
