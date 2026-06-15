import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';
import { AdminUsersService } from './admin-users.service';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

export class SyncAdminUserDto {
  email: string;
  name?: string;
  phoneNumber?: string;
  role?: string;
}

@Controller('admin-users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * POST /admin-users/sync
   *
   * Called by the mobile app on every login to upsert the admin user's
   * profile. Extracts the userId from the JWT and merges it with the
   * body payload (name, email, phoneNumber, role).
   */
  @UseGuards(NhostJwtGuard)
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@Req() req: AuthRequest, @Body() dto: SyncAdminUserDto) {
    const { userId, role: jwtRole } = req.user;
    this.logger.log(`Syncing admin user ${userId} (${dto.email})`);
    return this.adminUsersService.sync(userId, {
      ...dto,
      role: dto.role || jwtRole,
    });
  }

  /**
   * GET /admin-users/me
   *
   * Returns the current authenticated user's profile.
   */
  @UseGuards(NhostJwtGuard)
  @Get('me')
  async getMe(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Fetching profile for user ${userId}`);
    const user = await this.adminUsersService.findById(userId);
    return { data: user || {} };
  }

  /**
   * PATCH /admin-users/me
   *
   * Updates the current authenticated user's profile fields.
   */
  @UseGuards(NhostJwtGuard)
  @Patch('me')
  async updateMe(
    @Req() req: AuthRequest,
    @Body()
    dto: {
      name?: string;
      phoneNumber?: string;
      profile_picture?: string;
      preferences?: any;
    },
  ) {
    const { userId } = req.user;
    this.logger.log(`Updating profile for user ${userId}`);
    const updated = await this.adminUsersService.updateProfile(userId, dto);
    return { data: updated };
  }

  /**
   * DELETE /admin-users/me
   *
   * Deactivates (deletes) the current authenticated user's profile.
   */
  @UseGuards(NhostJwtGuard)
  @Delete('me')
  async deleteMe(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Deactivating profile for user ${userId}`);
    const result = await this.adminUsersService.deleteProfile(userId);
    return result;
  }
}
