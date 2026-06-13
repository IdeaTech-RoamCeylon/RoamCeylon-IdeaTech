import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '@/config/nhostClient';

const { width } = Dimensions.get('window');

const EmailVerificationScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) return;
    setResending(true);
    try {
      await nhost.auth.sendVerificationEmail({ 
        email, 
        options: { redirectTo: 'roamceylonadmin://login' }
      });
      showToast.success('Verification email sent!', 'Check Your Inbox');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      showToast.error(
        error?.message || 'Failed to resend. Please try again.',
        'Resend Failed',
      );
    } finally {
      setResending(false);
    }
  };

  const handleOpenEmailApp = async () => {
    try {
      const mailUrl = Platform.OS === 'ios' ? 'message://' : 'mailto:';
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
      } else {
        if (Platform.OS === 'android') {
          await Linking.openURL('https://mail.google.com');
        } else {
          showToast.info('Please open your email app manually.', 'Open Email');
        }
      }
    } catch {
      showToast.info('Please open your email app manually.', 'Open Email');
    }
  };

  return (
    <View style={styles.pageBackground}>
      <View style={styles.scrollContent}>
        {/* Card */}
        <View style={styles.card}>
          {/* Mail Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="email-check-outline" size={48} color="#075A1A" />
          </View>

          {/* Title & Description */}
          <Text style={styles.titleText}>Check Your Email</Text>
          <Text style={styles.subtitleText}>
            We&apos;ve sent a verification link to
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.instructionText}>
            Tap the link in the email to verify your account, then come back and log in.
          </Text>

          {/* Open Email App Button */}
          <TouchableOpacity
            style={styles.primaryButtonWrapper}
            onPress={handleOpenEmailApp}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFDF59', '#FFC83C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <MaterialCommunityIcons name="email-open-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Open Email App</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="login" size={18} color="#075A1A" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DIDN&apos;T RECEIVE IT?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Resend Link */}
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={resending}
            style={styles.resendButton}
          >
            <MaterialCommunityIcons
              name="email-sync-outline"
              size={16}
              color={resending ? '#9E9E9E' : '#9E7F47'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.resendText, resending && styles.resendTextDisabled]}>
              {resending ? 'Sending...' : 'Resend verification email'}
            </Text>
          </TouchableOpacity>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#9E9E9E" />
            <Text style={styles.tipText}>
              Check your spam or junk folder if you don&apos;t see it in your inbox.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#EAF4EF',
  },
  scrollContent: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 36,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 90,
    height: 90,
    backgroundColor: '#E8F8EA',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#075A1A',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FFD23F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#075A1A',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075A1A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9E7F47',
  },
  resendTextDisabled: {
    color: '#9E9E9E',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F7F9F7',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    width: '100%',
  },
  tipText: {
    fontSize: 13,
    color: '#9E9E9E',
    flex: 1,
    lineHeight: 18,
  },
});

export default EmailVerificationScreen;
