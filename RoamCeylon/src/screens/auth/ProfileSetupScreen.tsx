import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { showToast } from '../../utils/toast';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {LinearGradient } from 'expo-linear-gradient';  

const { width } = Dimensions.get('window');

const ProfileSetupScreen = () => {
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please enter both your name and email');
      return;
    }

    setLoading(true);
    try {
      // Call backend API to update profile with all fields
      await updateProfile(name.trim(), email.trim(), birthday, gender);
      
      // Refresh user data from backend
      await refreshUser();
      
      showToast.success('Profile created successfully!', 'Success');
      
      // Navigation will happen automatically via RootNavigator when isProfileComplete becomes true
    } catch (error) {
      console.error('Profile setup error:', error);
      showToast.apiError(error, 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <LinearGradient
      colors={['#99f0c6', '#dcf5e9', '#edf6f2']}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.container}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/Roam Ceylon Logo.png')} 
            style={styles.logo} 
            />
          <View style={{alignItems: 'flex-start', left: 30}}>
            <Text style={styles.welcomeText}>Welcome to </Text>
            <Text style={styles.welcomeSubText}>RoamCeylon!</Text>
          </View>
        </View>
          
        <View style={{alignItems: 'center', marginBottom: 30, marginTop: 275}}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Please provide your name and email to continue.</Text>
        </View>
        <Input
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          icon={<MaterialCommunityIcons name="account" size={24} color="#666" />}
        />

        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          icon={<MaterialCommunityIcons name="email" size={24} color="#666" />}
        />

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons name="cake" size={24} color="#666" style={styles.dateIcon} />
          <Text style={[styles.dateText, !birthday && styles.placeholderText]}>
            {birthday ? formatDate(birthday) : 'Enter Your Birthday'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={birthday || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.genderContainer}>
          <MaterialCommunityIcons name="gender-male-female" size={24} color="#666" style={styles.genderIcon} />
          <View style={styles.genderButtons}>
            {['Male', 'Female', 'Other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderButton,
                  gender === option && styles.genderButtonSelected,
                ]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === option && styles.genderButtonTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Finish Setup"
          onPress={handleComplete}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />
      </View>
    </LinearGradient>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // Remove centering so content flows from top left
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    width: width * 0.5,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  logo: {
    width: width*0.4,
    height: width*0.4,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'left',
  },
  welcomeSubText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#F4D03F',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 20,
  },
  datePickerButton: {
    width: width * 0.8,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateIcon: {
    marginRight: 11,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  genderContainer: {
    width: width * 0.8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  genderIcon: {
    marginRight: 15,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#59d595',
    borderColor: '#59d595',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
