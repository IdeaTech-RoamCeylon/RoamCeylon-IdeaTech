import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

@Controller('users')
@UseGuards(NhostJwtGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: { user: { userId: string } }) {
    const userId = req.user.userId;
    this.logger.log(`Fetching profile for user ${userId}`);
    return this.usersService.getUser(userId);
  }

  @Patch('me')
  async updateMe(
    @Req() req: { user: { userId: string } },
    @Body() body: Record<string, any>,
  ) {
    const userId = req.user.userId;
    this.logger.log(`Updating profile for user ${userId}`);
    return this.usersService.updateUser(userId, body);
  }
}
