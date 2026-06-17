import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // We use tourNotification as the underlying table for all admin notifications
    return this.prisma.tourNotification.findMany({
      where: { guideId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.tourNotification.count({
      where: { guideId: userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const existing = await this.prisma.tourNotification.findUnique({
      where: { id },
    });

    if (!existing || existing.guideId !== userId) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }

    return this.prisma.tourNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.tourNotification.updateMany({
      where: { guideId: userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );
    return { markedCount: result.count };
  }
}
