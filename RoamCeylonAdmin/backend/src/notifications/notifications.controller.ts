import { Controller, Get, Patch, Param, Req, UseGuards, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

@Controller('notifications')
@UseGuards(NhostJwtGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} fetching notifications`);
    return this.notificationsService.findAll(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: AuthRequest) {
    const { userId } = req.user;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} marking all notifications as read`);
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} marking notification ${id} as read`);
    return this.notificationsService.markAsRead(id, userId);
  }
}
