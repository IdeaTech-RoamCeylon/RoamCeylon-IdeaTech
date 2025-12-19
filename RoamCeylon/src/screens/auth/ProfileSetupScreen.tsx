import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';

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
      // For now, update local state which will trigger isProfileComplete
      const updatedUser = {
        ...user,
        id: user?.id || 'user-123',
        // Only include phoneNumber if it exists, don't overwrite with empty string
        ...(user?.phoneNumber && { phoneNumber: user.phoneNumber }),
        name: name.trim(),
        email: email.trim(),
      };
      
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
