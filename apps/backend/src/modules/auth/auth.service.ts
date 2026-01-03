import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // In-memory storage for mock auth (in real app, this would be in database)
  private static lastVerifiedPhone: string = '+94771234567';

  constructor(private readonly jwtService: JwtService) { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendOtp(_phoneNumber: string): { message: string } {
    return { message: 'OTP sent successfully' };
  }

  verifyOtp(
    _phoneNumber: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    // Store the verified phone number
    AuthService.lastVerifiedPhone = _phoneNumber;

    // Payload for JWT
    const payload = { username: _phoneNumber, sub: 'mock-user-id' };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: 'mock-user-id',
        phoneNumber: _phoneNumber,
      },
    };
  }

  // Method to get the last verified phone number
  static getLastVerifiedPhone(): string {
    return this.lastVerifiedPhone;
  }
}
