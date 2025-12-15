import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // In-memory storage for mock auth (in real app, this would be in database)
  private static lastVerifiedPhone: string = '+94771234567';

  sendOtp(phoneNumber: string): { message: string } {
    return { message: 'OTP sent successfully' };
  }

  verifyOtp(
    phoneNumber: string,
    otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    // Store the verified phone number
    AuthService.lastVerifiedPhone = phoneNumber;

    // Mock JWT token
    return {
      accessToken: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        phoneNumber,
      },
    };
  }

  // Method to get the last verified phone number
  static getLastVerifiedPhone(): string {
    return this.lastVerifiedPhone;
  }
}
