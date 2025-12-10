import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { verifyOtp } from '../services/auth';
import { useAuth } from '../context/AuthContext';

type AuthStackParamList = {
  PhoneEntry: undefined;
  OTP: { phoneNumber: string };
  ProfileSetup: undefined;
};

type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTP'>;
type OTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTP'>;

const OTPScreen = () => {
  const route = useRoute<OTPScreenRouteProp>();
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const { phoneNumber } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp(phoneNumber, otp);
      console.log('OTP verified successfully:', response);
      
      // Call login to store token and fetch user profile
      await login(response.accessToken);
      
      // Navigate to ProfileSetupScreen
      // The RootNavigator will keep user in AuthStack until profile is complete
      navigation.navigate('ProfileSetup');
      
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || 'Invalid OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>We sent a code to {phoneNumber}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} disabled={loading}>
        <Text style={styles.resendText}>Resend Code</Text>
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
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 10,
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
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: '#0066CC',
    fontSize: 16,
  },
});

export default OTPScreen;
