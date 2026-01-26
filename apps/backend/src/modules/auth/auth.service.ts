import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  // In-memory storage for mock auth (in real app, this would be in database)
  private static lastVerifiedPhone: string = '+94771234567';

  constructor(private readonly jwtService: JwtService) { }

  sendOtp(phoneNumber: string): { message: string } {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      throw new UnauthorizedException('Invalid phone number format');
    }

    this.logger.log(`Simulating OTP send to ${phoneNumber}`);
    return { message: `OTP sent successfully to ${phoneNumber}` };
  }

  verifyOtp(
    phoneNumber: string,
    otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    if (!phoneNumber || !otp) {
      throw new UnauthorizedException('Phone number and OTP are required');
    }

    // For mock: accept '123456' as valid OTP for any number
    if (otp !== '123456') {
      this.logger.warn(`Failed login attempt for ${phoneNumber} with OTP ${otp}`);
      throw new UnauthorizedException('Invalid OTP. Use 123456 for testing.');
    }

    // Store the verified phone number
    AuthService.lastVerifiedPhone = phoneNumber;

    // Payload for JWT
    const payload = {
      username: phoneNumber,
      sub: `user-${Buffer.from(phoneNumber).toString('hex').slice(0, 8)}`
    };

    this.logger.log(`User ${phoneNumber} verified successfully`);

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: payload.sub,
        phoneNumber: phoneNumber,
      },
    };
  }

  // Method to get the last verified phone number
  static getLastVerifiedPhone(): string {
    return this.lastVerifiedPhone;
  }
}
