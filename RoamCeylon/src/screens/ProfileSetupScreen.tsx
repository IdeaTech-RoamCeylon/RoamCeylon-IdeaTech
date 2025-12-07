import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileSetupScreen = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleComplete = async () => {
    // Placeholder - will save profile data later
    console.log('Profile setup complete:', { name, email });
    // Simulate login with a dummy token - replace with actual token from backend
    await login('dummy-token-for-demo');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipText}>Skip for now</Text>
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
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: '#0066CC',
    fontSize: 16,
  },
});

export default ProfileSetupScreen;
