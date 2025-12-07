import { Injectable } from '@nestjs/common';

@Injectable()
<<<<<<< HEAD
export class UsersService {}
=======
export class UsersService {
  getMe() {
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
    };
  }
}
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
