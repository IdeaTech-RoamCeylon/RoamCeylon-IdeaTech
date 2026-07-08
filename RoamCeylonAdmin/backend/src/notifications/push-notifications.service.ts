import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register an Expo push token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    platform: string = 'unknown',
  ) {
    this.logger.log(
      `Registering push token for user ${userId} (platform: ${platform})`,
    );

    // Upsert: if the token already exists, update the userId and platform
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });
  }

  /**
   * Remove a push token
   */
  async unregisterToken(userId: string, token: string) {
    this.logger.log(`Unregistering push token for user ${userId}`);

    const existing = await this.prisma.pushToken.findFirst({
      where: { token, userId },
    });

    if (!existing) {
      this.logger.warn(`Token not found for user ${userId}`);
      return { deleted: false };
    }

    await this.prisma.pushToken.delete({ where: { id: existing.id } });
    return { deleted: true };
  }

  /**
   * Send a push notification to a specific user (all their registered devices)
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<{ sent: number; tickets: ExpoPushTicket[] }> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return { sent: 0, tickets: [] };
    }

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      sound: 'default' as const,
      data: data || {},
    }));

    return this.sendPushNotifications(messages);
  }

  /**
   * Send push notifications via Expo Push API
   */
  private async sendPushNotifications(
    messages: ExpoPushMessage[],
  ): Promise<{ sent: number; tickets: ExpoPushTicket[] }> {
    try {
      this.logger.log(`Sending ${messages.length} push notification(s)`);

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      const tickets: ExpoPushTicket[] = result.data || [];

      // Log any errors
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.error(
            `Push notification failed for ${messages[index]?.to}: ${ticket.message}`,
          );
        }
      });

      const successCount = tickets.filter((t) => t.status === 'ok').length;
      this.logger.log(
        `Push notifications sent: ${successCount}/${messages.length} successful`,
      );

      return { sent: successCount, tickets };
    } catch (error) {
      this.logger.error('Failed to send push notifications', error);
      throw error;
    }
  }

  /**
   * Get all push tokens for a user
   */
  async getTokensForUser(userId: string) {
    return this.prisma.pushToken.findMany({
      where: { userId },
    });
  }
}
