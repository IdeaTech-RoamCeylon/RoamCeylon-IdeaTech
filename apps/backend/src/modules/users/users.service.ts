import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getMe() {
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
    };
  }
}
