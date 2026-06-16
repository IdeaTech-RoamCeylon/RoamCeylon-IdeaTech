import React, { useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { _width } = Dimensions.get('window');



const EnterNewPasswordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ refreshToken?: string; type?: string }>();
  const refreshToken = params?.refreshToken;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      router.push('/login');
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
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header section with Titles */}
          <View style={styles.header}>
            <Text style={styles.titleText}>Enter New Password</Text>
            <Text style={styles.subtitleText}>
              Please enter your new password below. Make sure it is at least 9 characters long.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              <View style={styles.formGroup}>
                
                {/* Password Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
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
                      editable={!loading}
                      autoCapitalize="none"
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

                {/* Confirm Password Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
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
                    <TouchableOpacity style={styles.iconContainer} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
    flexGrow: 1,
    backgroundColor: '#F6FAF6',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#F6FAF6',
    width: '100%',
    paddingHorizontal: 24,
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
    lineHeight: 22,
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
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 30,
  },
  formGroup: {
    width: '100%',
    gap: 16,
  },
  inputSection: {
    width: '100%',
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
    paddingLeft: 4,
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
  primaryButtonWrapper: {
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
  primaryButton: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default EnterNewPasswordScreen;
