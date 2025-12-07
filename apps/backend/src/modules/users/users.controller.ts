import { Controller, Get } from '@nestjs/common';
<<<<<<< HEAD

@Controller('users')
export class UsersController {
    @Get('me')
    getMe() {
        return { id: 1, name: 'John Doe', email: 'john@example.com' };
    }
=======
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    return this.usersService.getMe();
  }
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
}
