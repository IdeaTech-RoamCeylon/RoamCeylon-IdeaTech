import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    this.logger.log('Users getMe triggered');
    return this.usersService.getMe();
  }
}
