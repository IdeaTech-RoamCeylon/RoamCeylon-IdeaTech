import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
      title="Enter Your Phone Number"
      subtitle="We'll send you a verification code"
    >
      <Input
        placeholder="0771234567"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={(text) => {
          setPhoneNumber(text);
          setError('');
        }}
        error={error}
        disabled={loading}
        containerStyle={styles.inputContainer}
      />

      <Button 
        title="Send OTP"
        onPress={handleSendOTP}
        loading={loading}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
});

export default PhoneEntryScreen;
