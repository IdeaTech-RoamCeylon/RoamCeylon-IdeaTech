import { Controller, Get, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    this.logger.log('Users getMe triggered');
    return this.usersService.getMe();
  }
}
