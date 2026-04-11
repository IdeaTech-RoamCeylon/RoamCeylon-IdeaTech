import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { AuthLayout } from '../../components/AuthLayout';
import * as NavigationBar from 'expo-navigation-bar';
import * as SecureStore from 'expo-secure-store';
import { nhost } from '../../config/nhostClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type EmailOTPRouteProp = RouteProp<AuthStackParamList, 'EmailOTP'>;
type EmailOTPNavigationProp = StackNavigationProp<AuthStackParamList, 'EmailOTP'>;

const EmailOTPScreen = () => {
  const route = useRoute<EmailOTPRouteProp>();
  const navigation = useNavigation<EmailOTPNavigationProp>();
  const { email } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  // Countdown timer for Resend
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (!otpString || otpString.length !== 6) {
      showToast.error('Please enter the 6-digit code we sent to your email', 'Invalid Code');
      return;
    }

    setLoading(true);
    try {
      // nhost-js v4 does not expose verifySignInPasswordlessEmail for email
      // (only verifySignInPasswordlessSms exists). We call the Hasura Auth
      // REST endpoint directly to verify the email OTP code.
      const authBaseUrl = `https://${process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN}.auth.${process.env.EXPO_PUBLIC_NHOST_REGION}.nhost.run`;
      const verifyRes = await fetch(`${authBaseUrl}/v1/signin/passwordless/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (!verifyRes.ok) {
        const errBody = await verifyRes.json().catch(() => ({}));
        throw new Error(errBody?.message || `Verification failed (${verifyRes.status})`);
      }

      const data = await verifyRes.json();
      const session = data?.session;
      if (!session?.accessToken) {
        throw new Error('Verification failed. No session received.');
      }

      // Persist tokens
      await SecureStore.setItemAsync('authToken', session.accessToken);
      if (session.refreshToken) {
        await SecureStore.setItemAsync('nhostRefreshToken', session.refreshToken);
      }

      // Notify AuthContext — triggers isAuthenticated + profile fetch
      await login(session.accessToken);

      showToast.success('Email verified! Let\'s complete your profile.', 'Welcome!');

      // Navigate to profile setup (birthday, gender)
      navigation.navigate('ProfileSetup');
    } catch (error: any) {
      console.error('Email OTP verification failed:', error);
      showToast.error(
        error?.message || 'Invalid or expired code. Please try again.',
        'Verification Failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await nhost.auth.signInPasswordlessEmail({ email });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      showToast.success('A new verification code has been sent!', 'Code Resent');
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to resend code.', 'Error');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));

  return (
    <AuthLayout
      title="Verify your Email"
      subtitle={`We sent a 6-digit code to ${maskedEmail}`}
    >
      {/* OTP Boxes */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!loading}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.disabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify Email</Text>
        )}
      </TouchableOpacity>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
          {resending ? (
            <ActivityIndicator size="small" color="#16a669" />
          ) : (
            <Text style={[styles.resendLink, countdown > 0 && styles.resendLinkDisabled]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Email hint */}
      <View style={styles.hintBox}>
        <MaterialCommunityIcons name="email-outline" size={18} color="#4A9B7F" />
        <Text style={styles.hintText}>
          Check your spam folder if you don't see the email.
        </Text>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 30,
    gap: 10,
  },
  otpBox: {
    width: 46,
    height: 58,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 14,
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: '#16a669',
    backgroundColor: '#f0fdf4',
  },
  verifyButton: {
    backgroundColor: '#F4D03F',
    borderRadius: 30,
    paddingVertical: 16,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    minHeight: 54,
  },
  verifyButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: { opacity: 0.6 },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#16a669',
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: '#aaa',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 24,
    width: '90%',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#4A9B7F',
    flex: 1,
    lineHeight: 18,
  },
});

export default EmailOTPScreen;
