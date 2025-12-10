import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  getMe() {
    // Return user with only ID and phone number
    // Name and email will be added when user completes ProfileSetupScreen
    // Get the actual phone number that was verified during OTP
    return {
      id: 'mock-user-id',
      phoneNumber: AuthService.getLastVerifiedPhone(),
    };
  }
}
