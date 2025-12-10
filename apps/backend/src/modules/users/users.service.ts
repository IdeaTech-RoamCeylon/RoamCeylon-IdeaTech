import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getMe() {
    return {
      id: 'mock-user-id',
      phoneNumber: '+94771234567',
      name: 'Mock User',
      email: 'user@example.com',
    };
  }
}
