import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/auth';
import { showToast } from '../../utils/toast';

const ProfileSetupScreen = () => {
  const { refreshUser } = useAuth();
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
      // Call backend API to update profile
      await updateProfile(name.trim(), email.trim());
      
      // Refresh user data from backend
      await refreshUser();
      
      showToast.success('Profile updated successfully!', 'Success');
      
      // Navigation will happen automatically via RootNavigator when isProfileComplete becomes true
    } catch (error) {
      console.error('Profile setup error:', error);
      showToast.apiError(error, 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <Input
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <Input
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Button
        title="Complete Setup"
        onPress={handleComplete}
        loading={loading}
        disabled={loading}
        style={styles.button}
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
  button: {
    marginTop: 10,
  },
});

export default ProfileSetupScreen;
