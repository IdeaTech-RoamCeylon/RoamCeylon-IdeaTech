import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
    @Get('me')
    getMe() {
        return { id: 1, name: 'John Doe', email: 'john@example.com' };
    }
}
