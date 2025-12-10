import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  getMe() {
    return {
      id: 'mock-user-id',
      phoneNumber: AuthService.getLastVerifiedPhone() || '+94771234567',
      firstName: 'Sayura',
      lastName: 'Thejan',
      email: 'sayura.thejan@example.com',
      profilePicture: 'https://example.com/profile.jpg',
      preferences: {
        language: 'en',
        currency: 'LKR',
        notifications: true,
      },
    };
  }
}
