import {
  Controller,
  Get,
  Patch,
  Body,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req: AuthenticatedRequest) {
    this.logger.log('Users getMe triggered');
    const userId = req.user.userId;
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.logger.log('Users updateProfile triggered');
    const userId = req.user.userId;
    return this.usersService.updateProfile(userId, updateUserDto);
  }
}
