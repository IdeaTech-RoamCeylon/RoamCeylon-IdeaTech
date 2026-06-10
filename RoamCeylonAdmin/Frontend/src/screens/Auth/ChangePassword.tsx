import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { nhost } from '@/config/nhostClient';
import { showToast } from '@/utils/toast';

const ChangePassword = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Form Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password Strength Logic
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

  // Form Validation
  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 9) {
      tempErrors.password = 'Password must be at least 9 characters';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Submit
  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Build the Nhost auth base URL from env vars
      const subdomain = process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN;
      const region = process.env.EXPO_PUBLIC_NHOST_REGION;
      const authBaseUrl = `https://${subdomain}.auth.${region}.nhost.run/v1`;

      // Get the stored refresh token to request a fresh access token (matching EnterNewPasswordScreen)
      const refreshToken = await SecureStore.getItemAsync('nhostRefreshToken');
      if (!refreshToken) {
        throw new Error('No active session found. Please log in again.');
      }

      const tokenRes = await fetch(`${authBaseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.accessToken) {
        throw new Error(tokenData?.message || 'Session expired. Please log in again.');
      }

      const accessToken = tokenData.accessToken;

      // 1. Change password using the access token as Bearer auth
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

      // 2. Success, sign out via Nhost client first, then clear stored tokens
      try {
        await (nhost.auth as any).signOut();
      } catch (signOutErr) {
        console.warn('[ChangePassword] Nhost client signOut warning:', signOutErr);
      }

      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('nhostRefreshToken');

      showToast.success('Password updated successfully! Please log in again.', 'Success ✓');
      router.replace('/login');
    } catch (err: any) {
      console.error('[ChangePassword] Error changing password:', err);
      showToast.error(err.message || 'Failed to change password. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Elegant Gradient Hero Banner */}
          <LinearGradient
            colors={['#0F3D26', '#145334']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { paddingTop: insets.top + 20 }]}
          >
            {/* Header Row */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => router.back()}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.lockIconCircle}>
              <MaterialCommunityIcons name="shield-lock" size={44} color="#EAD26B" />
            </View>

            <Text style={styles.heroTitle}>Update Credentials</Text>
            <Text style={styles.heroSubtitle}>
              Ensure your account is secure by setting a strong, unique password.
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <Feather name="lock" size={18} color="#0E5E2F" style={{ marginRight: 12 }} />
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
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIconContainer} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color="#8F9B96" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4].map((idx) => {
                        let barColor = '#E0E0E0';
                        if (strength >= idx) {
                          if (strength === 1) barColor = '#FF4D4D';
                          else if (strength === 2) barColor = '#FF944D';
                          else if (strength === 3) barColor = '#FFD700';
                          else if (strength === 4) barColor = '#34C759';
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

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
                  <Feather name="lock" size={18} color="#0E5E2F" style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#B5C0BC"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: '' }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIconContainer} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialCommunityIcons 
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color="#8F9B96" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Changing Password...' : 'Update Password'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <View style={styles.badgeContainer}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#0E5E2F" />
                <Text style={styles.badgeText}>SECURE PORTAL ACTIVE</Text>
              </View>
              <Text style={styles.footerText}>
                INNOVATED BY IDEATECH
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  heroBanner: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  lockIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  formGroup: {
    gap: 18,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60646C',
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
    borderWidth: 1.2,
    borderColor: '#D8E5E0',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    height: '100%',
    fontWeight: '600',
  },
  eyeIconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 4,
    fontWeight: '600',
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
  submitButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#493D1B',
    fontSize: 16,
    fontWeight: '800',
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
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
    fontWeight: '700',
    color: '#7D8A82',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});

export default ChangePassword;
