import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

@Controller('notifications')
@UseGuards(NhostJwtGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

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

  // ─── Push Notification Endpoints ────────────────────────────────────────────

  /**
   * Register an Expo push token for the authenticated user
   * POST /notifications/register-token
   * Body: { token: string, platform?: string }
   */
  @Post('register-token')
  async registerPushToken(
    @Req() req: AuthRequest,
    @Body() body: { token: string; platform?: string },
  ) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} registering push token`);
    const result = await this.pushNotificationsService.registerToken(
      userId,
      body.token,
      body.platform || 'unknown',
    );
    return { success: true, data: result };
  }

  /**
   * Unregister an Expo push token
   * DELETE /notifications/unregister-token
   * Body: { token: string }
   */
  @Delete('unregister-token')
  async unregisterPushToken(
    @Req() req: AuthRequest,
    @Body() body: { token: string },
  ) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} unregistering push token`);
    const result = await this.pushNotificationsService.unregisterToken(
      userId,
      body.token,
    );
    return { success: true, ...result };
  }

  /**
   * Send a test push notification to the calling user's own devices
   * POST /notifications/test
   */
  @Post('test')
  async sendTestNotification(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`User ${userId} requesting test notification`);
    const result = await this.pushNotificationsService.sendToUser(
      userId,
      '🔔 RoamCeylon Admin',
      'Push notifications are working! You will receive alerts for new bookings and updates.',
      { type: 'test' },
    );
    return { success: true, ...result };
  }

  /**
   * Send a push notification to a specific user (admin use)
   * POST /notifications/send
   * Body: { userId: string, title: string, body: string, data?: object }
   */
  @Post('send')
  async sendNotification(
    @Req() req: AuthRequest,
    @Body()
    body: {
      userId: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    const adminId = req.user.userId;
    this.logger.log(
      `Admin ${adminId} sending notification to user ${body.userId}`,
    );
    const result = await this.pushNotificationsService.sendToUser(
      body.userId,
      body.title,
      body.body,
      body.data,
    );
    return { success: true, ...result };
  }
}
