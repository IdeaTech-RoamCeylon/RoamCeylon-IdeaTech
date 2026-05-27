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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { showToast } from '../../utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '../../config/nhostClient';

const { width } = Dimensions.get('window');

const PasswordResetScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

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
          redirectTo: 'roamceylon://reset-password',
        },
      });

      if (response.error || response.body?.error) {
        const errorMsg = response.error?.message || response.body?.error?.message || 'Failed to send recovery link.';
        throw new Error(errorMsg);
      }

      navigation.navigate('LinkSent', { email: email.trim().toLowerCase() });
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Soft Green Gradient/Blob in top-right corner */}
            <LinearGradient
              colors={['rgba(149, 242, 138, 0.25)', 'rgba(149, 242, 138, 0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.greenBlob}
            />

            {/* Header */}
            <Text style={styles.titleText}>Reset Password</Text>
            <Text style={styles.subtitleText}>
              Enter your email address to receive a recovery link.
            </Text>

            {/* Email Input Field */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color="#B08E50"
                  style={styles.leftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="traveler@roamceylon.com"
                  placeholderTextColor="#C4C4C4"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
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
                <MaterialCommunityIcons
                  name="send"
                  size={16}
                  color="#1a1a1a"
                  style={styles.buttonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Spam check Warning Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#856404" />
            </View>
            <Text style={styles.infoText}>
              Check your spam folder if you don't see the email within 2 minutes.
            </Text>
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
    paddingBottom: 60,
    paddingHorizontal: 24,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#706B63',
    fontWeight: '400',
    marginBottom: 35,
  },
  inputSection: {
    width: '100%',
    marginBottom: 30,
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
  leftIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    height: '100%',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 4,
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
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FFE074',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 35,
    width: '100%',
  },
  infoIconWrapper: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#706B63',
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default PasswordResetScreen;
