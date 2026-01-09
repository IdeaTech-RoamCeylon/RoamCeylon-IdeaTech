import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  getMe() {
    this.logger.log('Fetching mock user profile');
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
    };
  }
}
