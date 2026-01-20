import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Input } from '../../components';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { verifyOtp } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { AuthLayout } from '../../components/AuthLayout';

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
      showToast.error('Please enter a 6-digit verification code', 'Invalid OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp(phoneNumber, otp);
      
      // Call login to store token and fetch user profile
      await login(response.accessToken);
      
      showToast.success('OTP verified successfully!', 'Success');
      
      // Navigate to ProfileSetupScreen
      // The RootNavigator will keep user in AuthStack until profile is complete
      navigation.navigate('ProfileSetup');
      
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      showToast.apiError(error, 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle={`We sent a code to ${phoneNumber}`}
    >
      <Input
        style={styles.input}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        disabled={loading}
      />

      <Button
        title="Verify"
        onPress={handleVerifyOTP}
        loading={loading}
        disabled={loading}
        style={styles.verifyButton}
      />

      <Button
        title="Resend Code"
        onPress={() => {}} // Placeholder for resend logic
        variant="outline"
        disabled={loading}
        style={styles.resendButton}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 10,
  },
  verifyButton: {
    width: '100%',
  },
  resendButton: {
    marginTop: 20,
    width: '100%',
  },
});

export default OTPScreen;
