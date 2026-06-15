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
import { useRouter } from 'expo-router';
import { showToast } from '@/utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '@/config/nhostClient';

const { _width } = Dimensions.get('window');

const PasswordResetScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendRecoveryLink = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await (nhost.auth as any).sendPasswordResetEmail({
        email: email.trim().toLowerCase(),
        options: {
          redirectTo: 'roamceylonadmin://enterNewPassword',
        },
      });

      if (response.error || response.body?.error) {
        const errorMsg = response.error?.message || response.body?.error?.message || 'Failed to send recovery link.';
        throw new Error(errorMsg);
      }

      router.push({
        pathname: '/linkSent',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      showToast.error(
        err?.message || 'Failed to send password reset link. Please try again.',
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
          {/* Header section with Reset Icon and Titles */}
          <View style={styles.header}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#0E5E2F" />
            </TouchableOpacity>

            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={32} color="#0E5E2F" />
            </View>
            <Text style={styles.titleText}>Reset Password</Text>
            <Text style={styles.subtitleText}>
              Enter your email address to receive a recovery link.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              {/* Email Input Field */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="partner@roamceylon.com"
                    placeholderTextColor="#B5C0BC"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#8F9B96" />
                  </View>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              {/* Send Recovery Link Button */}
              <TouchableOpacity
                style={[styles.primaryButtonWrapper, loading && styles.disabled]}
                onPress={handleSendRecoveryLink}
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
                    {loading ? 'Sending...' : 'Send Recovery Link'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Spam check Warning Banner */}
              <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#0E5E2F" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  Check your spam folder if you don&apos;t see the email within 2 minutes.
                </Text>
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
    backgroundColor: '#F6FAF6',
  },
  flex: {
    flex: 1,
  },
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
    paddingTop: 50,
    paddingBottom: 25,
    backgroundColor: '#F6FAF6',
    width: '100%',
    position: 'relative',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
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
  inputSection: {
    marginBottom: 20,
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
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
    marginBottom: 20,
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  infoIcon: {
    marginRight: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#494034',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default PasswordResetScreen;
