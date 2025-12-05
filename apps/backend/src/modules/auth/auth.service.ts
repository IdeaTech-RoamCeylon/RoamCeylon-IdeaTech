import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  sendOtp(phoneNumber: string): { message: string } {
    console.log(`Sending OTP to ${phoneNumber}`);
    return { message: 'OTP sent successfully' };
  }

  verifyOtp(
    phoneNumber: string,
    otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    console.log(`Verifying OTP ${otp} for ${phoneNumber}`);
    // Mock JWT token
    return {
      accessToken: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        phoneNumber,
      },
    };
  }
}
