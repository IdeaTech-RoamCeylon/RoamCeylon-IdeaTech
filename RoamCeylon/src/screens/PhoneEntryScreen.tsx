import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PhoneEntryScreen = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = () => {
    // Placeholder - will integrate with sendOtp service later
    console.log('Sending OTP to:', phoneNumber);
    navigation.navigate('OTP' as never);
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
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
        <Text style={styles.buttonText}>Send OTP</Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PhoneEntryScreen;
