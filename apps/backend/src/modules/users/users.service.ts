import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    async getMe() {
        return {
            id: 'mock-user-id',
            email: 'user@example.com',
            name: 'Mock User',
        };
    }
}
