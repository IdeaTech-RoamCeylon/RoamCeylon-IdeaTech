import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileSetupScreen = () => {
  const { updateUserProfile, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please enter both your name and email');
      return;
    }

    setLoading(true);
    try {
      console.log('=== ProfileSetup: Starting ===');
      console.log('Current user object:', JSON.stringify(user, null, 2));
      console.log('User phone number:', user?.phoneNumber);
      
      // TODO: Call backend API to update profile once endpoint is created
      // For now, update local state which will trigger isProfileComplete
      const updatedUser = {
        ...user,
        id: user?.id || 'user-123',
        // Only include phoneNumber if it exists, don't overwrite with empty string
        ...(user?.phoneNumber && { phoneNumber: user.phoneNumber }),
        name: name.trim(),
        email: email.trim(),
      };
      
      console.log('Updated user object:', JSON.stringify(updatedUser, null, 2));
      
      // This will update user and immediately set isProfileComplete to true
      updateUserProfile(updatedUser);
      
      // Navigation will happen automatically via RootNavigator when isProfileComplete becomes true
      // Note: We don't call refreshUser() here as it causes navigation flickering
      // The backend will be synced on next app load
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
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

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete Setup</Text>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen;
