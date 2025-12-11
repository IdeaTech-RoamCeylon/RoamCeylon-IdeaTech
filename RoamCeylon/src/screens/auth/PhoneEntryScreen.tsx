import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { sendOtp } from '../../services/auth';
import { showToast } from '../../utils/toast';
import { Button, Input } from '../../components';

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
      console.log('OTP sent successfully to:', phoneNumber);
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
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you a verification code</Text>

      <Input
        placeholder="+94 XX XXX XXXX"
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
  inputContainer: {
    marginBottom: 20,
  },
});

export default PhoneEntryScreen;
