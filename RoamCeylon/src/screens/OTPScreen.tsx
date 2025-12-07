import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const OTPScreen = () => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState('');

  const handleVerifyOTP = () => {
    // Placeholder - will integrate with verifyOtp service later
    console.log('Verifying OTP:', otp);
    navigation.navigate('ProfileSetup' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>We sent a code to your phone</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
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
