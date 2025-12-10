import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { sendOtp } from '../services/auth';
import { showToast } from '../utils/toast';

type AuthStackParamList = {
  PhoneEntry: undefined;
  OTP: { phoneNumber: string };
  ProfileSetup: undefined;
};

const PhoneEntryScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast.error('Please enter a valid phone number', 'Invalid Phone');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phoneNumber);
      console.log('OTP sent successfully to:', phoneNumber);
      showToast.success('Verification code sent!', 'Success');
      navigation.navigate('OTP', { phoneNumber });
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      showToast.apiError(error, 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you a verification code</Text>

      <TextInput
        style={styles.input}
        //implement country codes later
        placeholder="+94 XX XXX XXXX" // for now default sri lanka country codes
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PhoneEntryScreen;
