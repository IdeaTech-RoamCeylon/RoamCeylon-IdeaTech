import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, getMe } from '../../services/auth';

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [birthday, setBirthday] = useState(user?.birthday ? user.birthday.split('T')[0] : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>(user?.gender || '');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const latestUser = await getMe();
        if (latestUser) {
          setName(latestUser.name || '');
          setEmail(latestUser.email || '');
          setPhoneNumber(latestUser.phoneNumber || '');
          setBirthday(latestUser.birthday ? latestUser.birthday.split('T')[0] : '');
          setGender(latestUser.gender || '');
        }
      } catch (err) {
        console.error('Error fetching latest user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchLatestProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'A valid email is required.');
      return;
    }

    setSaving(true);
    try {
      // Parse birthday
      let birthdayDate: Date | undefined;
      if (birthday.trim()) {
        birthdayDate = new Date(birthday.trim());
        if (isNaN(birthdayDate.getTime())) {
          Alert.alert('Validation Error', 'Please enter a valid birthday in YYYY-MM-DD format.');
          setSaving(false);
          return;
        }
      }

      await updateProfile(
        name.trim(),
        email.trim(),
        birthdayDate,
        gender || undefined,
        phoneNumber.trim() || undefined,
        user?.isLocal
      );

      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error?.message || 'Failed to update personal info. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B5E27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Info</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loadingProfile ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#6B5E27" />
          <Text style={styles.loadingText}>Fetching profile details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A1A09B"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#A1A09B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number (e.g. +94771234567)"
                  placeholderTextColor="#A1A09B"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Birthday */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#8A8984" style={styles.inputIcon} />
                <TextInput
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A1A09B"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonSelected,
                    ]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === g && styles.genderButtonTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Details</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E2D6',
  },
  genderButtonSelected: {
    backgroundColor: '#6B5E27',
    borderColor: '#6B5E27',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3F3E3A',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#6B5E27',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default PersonalInfoScreen;
