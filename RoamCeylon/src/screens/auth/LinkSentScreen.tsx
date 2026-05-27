import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
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

type LinkSentScreenRouteProp = RouteProp<AuthStackParamList, 'LinkSent'>;

const LinkSentScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<LinkSentScreenRouteProp>();
  const { email } = route.params;

  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const response = await (nhost.auth as any).sendPasswordResetEmail({
        email: email.trim().toLowerCase(),
        options: {
          redirectTo: 'roamceylon://reset-password',
        },
      });

      if (response.error || response.body?.error) {
        const errorMsg = response.error?.message || response.body?.error?.message || 'Failed to resend recovery link.';
        throw new Error(errorMsg);
      }

      showToast.success('Recovery link resent successfully!', 'Check Your Inbox');
    } catch (error: any) {
      console.error('Resend reset password error:', error);
      showToast.error(
        error?.message || 'Failed to resend. Please try again.',
        'Resend Failed'
      );
    } finally {
      setResending(false);
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
          {/* Card */}
          <View style={styles.card}>
            {/* Soft Green Gradient/Blob in top-right corner */}
            <LinearGradient
              colors={['rgba(149, 242, 138, 0.25)', 'rgba(149, 242, 138, 0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.greenBlob}
            />

            {/* Centered Large Green Circle with Airplane and Check Badge */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="airplane-takeoff" size={44} color="#075A1A" />
              </View>
              {/* Checkmark Badge */}
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#075A1A" />
              </View>
            </View>

            {/* Title & Description */}
            <Text style={styles.titleText}>Recovery Link Sent!</Text>
            <Text style={styles.subtitleText}>
              Check your inbox for a link to reset your password. If you don't see it, check your spam folder.
            </Text>

            {/* Back to Login Button */}
            <TouchableOpacity
              style={styles.primaryButtonWrapper}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFDF59', '#FFC83C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Email Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, resending && styles.disabled]}
              onPress={handleResendEmail}
              disabled={resending}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                {resending ? 'Resending...' : 'Resend Email'}
              </Text>
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
    paddingBottom: 60,
    paddingHorizontal: 24,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
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
  iconContainer: {
    position: 'relative',
    marginBottom: 35,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#95F28A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#95F28A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#706B63',
    fontWeight: '400',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 10,
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
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
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
  disabled: {
    opacity: 0.6,
  },
});

export default LinkSentScreen;
