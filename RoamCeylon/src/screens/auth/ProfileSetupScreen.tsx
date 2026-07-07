import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { showToast } from '../../utils/toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { nhost } from '../../config/nhostClient';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = typeof GENDERS[number];

const ProfileSetupScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { refreshUser } = useAuth();

  // ── Form fields ────────────────────────────────────────────
  // name & email are prefilled from Google/registration and shown read-only:
  // email is the auth identity, so it must not be edited here.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [isLocal, setIsLocal] = useState<boolean | undefined>(undefined);

  // ── UI state ───────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);

  // Pre-fill profile details from SecureStore or Nhost (from registration / Google).
  useEffect(() => {
    const loadFields = async () => {
      // 1. Try to load from local SecureStore temp data (email/password flow)
      const tempRegDataStr = await SecureStore.getItemAsync('tempRegistrationData');
      if (tempRegDataStr) {
        try {
          const tempRegData = JSON.parse(tempRegDataStr);
          if (tempRegData.name) setName(tempRegData.name);
          if (tempRegData.email) setEmail(tempRegData.email);
          if (tempRegData.phoneNumber) setPhoneNumber(tempRegData.phoneNumber);
          if (tempRegData.birthday) setBirthday(new Date(tempRegData.birthday));
          if (tempRegData.gender) setGender(tempRegData.gender);
          if (typeof tempRegData.isLocal === 'boolean') setIsLocal(tempRegData.isLocal);
          return; // Successfully loaded from SecureStore
        } catch (e) {
          console.error('Failed to parse temp registration data in ProfileSetupScreen:', e);
        }
      }

      // 2. Fallback to the Nhost user object (Google sign-in provides name + email)
      let nhostUserRaw: any = nhost.auth.getUser();
      if (nhostUserRaw instanceof Promise) {
        const res = await nhostUserRaw;
        nhostUserRaw = res?.user || res?.data || res;
      }

      const nhostUser = nhostUserRaw;
      if (nhostUser) {
        if (nhostUser.displayName) setName(nhostUser.displayName);
        if (nhostUser.email) setEmail(nhostUser.email);
        if (nhostUser.metadata?.phoneNumber) setPhoneNumber(nhostUser.metadata.phoneNumber as string);
        if (nhostUser.metadata?.birthday) setBirthday(new Date(nhostUser.metadata.birthday as string));
        if (nhostUser.metadata?.gender) setGender(nhostUser.metadata.gender as Gender);
        if (typeof nhostUser.metadata?.isLocal === 'boolean') setIsLocal(nhostUser.metadata.isLocal as boolean);
      }
    };
    loadFields();
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate);
      setErrors((e) => ({ ...e, birthday: '' }));
    }
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!phoneNumber.trim()) {
      e.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 10) {
      e.phoneNumber = 'Please enter a valid phone number';
    }
    if (!birthday) e.birthday = 'Birthday is required';
    if (!gender) e.gender = 'Please select a gender';
    if (isLocal === undefined) e.isLocal = 'Please select your visitor type';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Persist all six fields to the NestJS backend.
      await updateProfile(
        name.trim(),
        email.trim(),
        birthday,
        gender,
        phoneNumber.trim(),
        isLocal,
      );

      // Refresh user data — once the profile is complete, RootNavigator
      // automatically switches to the MainStack.
      await refreshUser();

      showToast.success('Profile created successfully!', 'Success');
    } catch (error) {
      console.error('Profile setup error:', error);
      showToast.apiError(error, 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render Helpers ─────────────────────────────────────────
  const renderInputCard = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    iconName: keyof typeof MaterialCommunityIcons.glyphMap,
    errorKey: string,
    keyboardType: any = 'default',
    autoCapitalize: any = 'words',
    editable: boolean = true,
  ) => {
    return (
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            !editable ? styles.inputReadOnly : null,
            errors[errorKey] ? styles.inputError : null,
          ]}
        >
          <TextInput
            style={[styles.textInput, !editable ? styles.textInputReadOnly : null]}
            placeholder={placeholder}
            placeholderTextColor="#B5C0BC"
            value={value}
            onChangeText={(t) => {
              onChangeText(t);
              if (errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: '' }));
            }}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={editable && !loading}
          />
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={editable ? iconName : 'lock-outline'}
              size={20}
              color="#8F9B96"
            />
          </View>
        </View>
        {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.pageBackground}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header / Hero Image - full bleed */}
          <View style={styles.heroContainer}>
            <Image
              source={require('../../assets/registerscreen.png')}
              style={styles.heroImage}
            />
          </View>

          {/* White Card overlapping the hero image */}
          <View style={styles.card}>
            <View style={styles.contentContainer}>
              {/* Titles */}
              <Text style={styles.titleText}>Complete your profile</Text>
              <Text style={styles.subtitleText}>
                Just a few more details to personalize your journey.
              </Text>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                {renderInputCard(
                  'FULL NAME',
                  'Ariyan Perera',
                  name,
                  setName,
                  'account-outline',
                  'name',
                  'default',
                  'words',
                  false, // read-only (from Google)
                )}

                {renderInputCard(
                  'EMAIL ADDRESS',
                  'hello@roamceylon.lk',
                  email,
                  setEmail,
                  'email-outline',
                  'email',
                  'email-address',
                  'none',
                  false, // read-only (auth identity)
                )}

                {renderInputCard(
                  'PHONE NUMBER',
                  '+94 77 123 4567',
                  phoneNumber,
                  setPhoneNumber,
                  'phone-outline',
                  'phoneNumber',
                  'phone-pad',
                  'none',
                )}

                {/* BIRTHDAY and GENDER row */}
                <View style={styles.row}>
                  {/* Birthday Section */}
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>BIRTHDAY</Text>
                    <TouchableOpacity
                      style={[styles.inputWrapper, errors.birthday ? styles.inputError : null]}
                      onPress={() => { setShowDatePicker(true); setErrors((e) => ({ ...e, birthday: '' })); }}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text
                        numberOfLines={1}
                        style={[styles.birthdayText, !birthday && styles.placeholderText]}
                      >
                        {birthday ? formatDate(birthday) : 'MM/DD/YYYY'}
                      </Text>
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#8F9B96" />
                      </View>
                    </TouchableOpacity>
                    {errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}
                  </View>

                  {/* Gender Section */}
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>GENDER</Text>
                    <View style={[styles.genderContainer, errors.gender ? styles.inputError : null]}>
                      {GENDERS.map((option) => {
                        const isActive = gender === option;
                        let displayLabel = 'M';
                        if (option === 'Female') displayLabel = 'F';
                        else if (option === 'Other') displayLabel = 'O';

                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.genderOptionBtn,
                              isActive ? styles.genderOptionBtnActive : null,
                            ]}
                            onPress={() => { setGender(option); setErrors((e) => ({ ...e, gender: '' })); }}
                            disabled={loading}
                            activeOpacity={0.8}
                          >
                            <Text style={[
                              styles.genderOptionText,
                              isActive ? styles.genderOptionTextActive : null,
                            ]}>
                              {displayLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                  </View>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={birthday || new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}

                {/* Visitor Type ("I AM A") */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>I AM A</Text>
                  <View style={styles.visitorRow}>
                    {([
                      { label: 'Local', value: true, icon: 'earth' },
                      { label: 'Foreigner', value: false, icon: 'airplane' },
                    ] as const).map(({ label, value, icon }) => {
                      const isActive = isLocal === value;
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.visitorBtn,
                            isActive ? styles.visitorBtnActive : styles.visitorBtnInactive,
                          ]}
                          onPress={() => { setIsLocal(value); setErrors((e) => ({ ...e, isLocal: '' })); }}
                          disabled={loading}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons
                            name={icon}
                            size={20}
                            color={isActive ? '#0E5E2F' : '#494034'}
                            style={styles.visitorIcon}
                          />
                          <Text style={[
                            styles.visitorBtnText,
                            isActive ? styles.visitorBtnTextActive : styles.visitorBtnTextInactive,
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.isLocal ? <Text style={styles.errorText}>{errors.isLocal}</Text> : null}
                </View>
              </View>

              {/* Finish Button */}
              <TouchableOpacity
                style={[styles.registerButtonWrapper, loading && styles.disabled]}
                onPress={handleComplete}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FFDF59', '#FFC83C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Saving...' : 'Finish Setup'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Innovated By Footer */}
              <Text style={styles.footerText}>
                INNOVATED BY ROAM CEYLON
              </Text>
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
    backgroundColor: '#ffffff',
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 160,
    paddingHorizontal: 0,
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  heroContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 30,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  subtitleText: {
    fontSize: 16,
    color: '#494034',
    marginTop: 6,
    lineHeight: 22,
  },
  formGroup: {
    marginTop: 25,
    gap: 16,
  },
  inputSection: {
    marginBottom: 0,
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
  inputReadOnly: {
    backgroundColor: '#F1F4F9',
    borderColor: '#E2ECE9',
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
  textInputReadOnly: {
    color: '#8F9B96',
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfCol: {
    width: '48%',
  },
  birthdayText: {
    fontSize: 15,
    color: '#494034',
    flex: 1,
  },
  placeholderText: {
    color: '#B5C0BC',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 58,
    borderWidth: 1,
    borderColor: '#D8E5E0',
    padding: 4,
  },
  genderOptionBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  genderOptionBtnActive: {
    backgroundColor: '#9CEEA4',
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#494034',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
  visitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  visitorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
  },
  visitorBtnActive: {
    backgroundColor: '#9CEEA4',
    borderColor: '#9CEEA4',
  },
  visitorBtnInactive: {
    backgroundColor: '#F1F4F9',
    borderColor: '#E2ECE9',
  },
  visitorBtnText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  visitorBtnTextActive: {
    color: '#0E5E2F',
  },
  visitorBtnTextInactive: {
    color: '#494034',
  },
  visitorIcon: {
    marginRight: 2,
  },
  registerButtonWrapper: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFC83C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButton: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D3008',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1.2,
  },
});

export default ProfileSetupScreen;
