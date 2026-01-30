import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { sendOtp } from '../../services/auth';
import { showToast } from '../../utils/toast';
import { Button, Input } from '../../components';
import { AuthLayout } from '../../components/AuthLayout';

const PhoneEntryScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      showToast.error('Please enter a valid phone number', 'Invalid Phone');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await sendOtp(phoneNumber);
      showToast.success('Verification code sent!', 'Success');
      navigation.navigate('OTP', { phoneNumber });
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      showToast.apiError(error, 'Failed to send OTP. Please try again.');
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthLayout
        title="Enter your phone number"
        subtitle="We'll send you a verification code"
        showLogo={true}
      >
        <View style={styles.phoneInputWrapper}>
          <Input
            placeholder="07 XXX XXXX"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setError('');
            }}
            error={error}
            disabled={loading}
          />
          </View>
          <Text style={styles.helperText}>Enter your 10 digit mobile number</Text>
        

        <TouchableOpacity 
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'SENDING...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  phoneInputWrapper: {
    width: '95%',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 0,
    width: '100%',
  },
  helperText: {
    fontSize: 13,
    color: '#4A9B7F',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#F4D03F',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    marginTop: 2,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  termsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#4A9B7F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom:150,
  },
  termsLink: {
    color: '#2C7A5F',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default PhoneEntryScreen;
