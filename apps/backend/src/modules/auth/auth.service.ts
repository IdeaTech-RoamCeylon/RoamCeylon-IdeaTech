import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  sendOtp(phoneNumber: string): { message: string } {
    this.logger.log(`Sending OTP to ${phoneNumber}`);
    return { message: 'OTP sent successfully' };
  }

  verifyOtp(
    phoneNumber: string,
    otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    this.logger.log(`Verifying OTP ${otp} for ${phoneNumber}`);
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
