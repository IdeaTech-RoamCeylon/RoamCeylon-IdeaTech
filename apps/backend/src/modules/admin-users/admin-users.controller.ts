import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('admin-users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('me')
  getMe(@Request() req: AuthenticatedRequest) {
    this.logger.log('AdminUsers getMe triggered');
    const userId = req.user.userId;
    return this.adminUsersService.getMe(userId);
  }

  @Patch('me')
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateAdminUserDto,
  ) {
    this.logger.log('AdminUsers updateProfile triggered');
    const userId = req.user.userId;
    return this.adminUsersService.updateProfile(userId, updateDto);
  }

  @Post('sync')
  syncProfile(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      role?: string;
    },
  ) {
    this.logger.log('AdminUsers syncProfile triggered');
    const userId = req.user.userId;
    return this.adminUsersService.syncProfile(userId, body);
  }
}
