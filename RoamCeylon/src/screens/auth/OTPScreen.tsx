import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, Platform } from 'react-native';
import { Button } from '../../components';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { verifyOtp } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { AuthLayout } from '../../components/AuthLayout';
import * as NavigationBar from 'expo-navigation-bar';

type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTP'>;
type OTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTP'>;

const OTPScreen = () => {
  const route = useRoute<OTPScreenRouteProp>();
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const { phoneNumber } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }
  }, []);
  
  // Create refs for each input box
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (!otpString || otpString.length !== 6) {
      showToast.error('Please enter a 6-digit verification code', 'Invalid OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp(phoneNumber, otpString);
      
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
      title="Verify your Phone Number"
      subtitle={`We sent a code to ${phoneNumber}`}
    >
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.otpBox,
              digit ? styles.otpBoxFilled : null,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!loading}
            selectTextOnFocus
          />
        ))}
      </View>

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
        textStyle={styles.resendButtonText}
      />

      i
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginBottom: 30,
    paddingHorizontal: 10,
    gap: 10,
    fontSize: 10,
  },
  otpBox: {
    width: 40,
    height: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: '#59d595',
    backgroundColor: '#f0fdf4',
  },
  verifyButton: {
    backgroundColor: '#F4D03F',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  resendButton: {
    marginTop: 20,
    width: '90%',
    marginBottom: 150,
    borderColor: '#f4d03f',
    color: '#ffffff',
  },
  resendButtonText: {
    color: '#000000',
  },
});

export default OTPScreen;
