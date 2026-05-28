import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { nhost } from '../../config/nhostClient';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const nhostUser = nhost.auth.getUser() as any;
  const isGoogleUser = nhostUser?.providerId === 'google';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (!newPassword) {
      Alert.alert('Validation Error', 'New password is required.');
      return;
    }
    if (newPassword.length < 9) {
      Alert.alert('Validation Error', 'Password must be at least 9 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setChanging(true);
    try {
      // In Nhost, changeUserPassword takes the new password directly for authenticated session
      const { error } = await (nhost.auth as any).changeUserPassword({ newPassword });
      if (error) {
        throw new Error(error.message);
      }
      Alert.alert('Success', 'Password changed successfully.');
      navigation.goBack();
    } catch (err: any) {
      console.error('Password change error:', err);
      Alert.alert('Error', err?.message || 'Failed to change password. Please try again.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B5E27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {isGoogleUser ? (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBg}>
              <Ionicons name="logo-google" size={32} color="#4285F4" />
            </View>
            <Text style={styles.infoTitle}>Google Authentication</Text>
            <Text style={styles.infoDescription}>
              You are logged in using Google. Your authentication is managed by Google directly, and you cannot change your password through Roam Ceylon.
            </Text>
            <TouchableOpacity style={styles.backHomeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backHomeButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formInfoText}>
              Provide a new strong password below to update your account.
            </Text>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#A1A09B"
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#A1A09B"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            {/* Change Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={changing}
              activeOpacity={0.8}
            >
              {changing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6B5E27',
    letterSpacing: -0.5,
  },
  headerPlaceholder: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formInfoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F5F5F',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A8984',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E6E2D6',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#3F3E3A',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6B5E27',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6B5E27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 10,
  },
  infoDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeButton: {
    backgroundColor: '#6B5E27',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  backHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
});

export default ChangePasswordScreen;
