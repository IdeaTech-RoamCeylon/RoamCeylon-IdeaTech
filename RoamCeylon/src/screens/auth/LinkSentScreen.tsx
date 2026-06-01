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
          {/* Header section with Centered Icon and Titles */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="airplane-takeoff" size={44} color="#0E5E2F" />
              </View>
              {/* Checkmark Badge */}
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#0E5E2F" />
              </View>
            </View>

            <Text style={styles.titleText}>Recovery Link Sent!</Text>
            <Text style={styles.subtitleText}>
              Check your inbox for a link to reset your password. If you don't see it, check your spam folder.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
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
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#F6FAF6',
    width: '100%',
    paddingHorizontal: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9CEEA4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9CEEA4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
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
    paddingTop: 40,
    gap: 16,
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
  },
  secondaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFDF59',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default LinkSentScreen;
