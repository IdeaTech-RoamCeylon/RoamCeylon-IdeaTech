/**
 * WebSocket Gateway for Real-Time Recommendation Updates
 * Emits new recommendations when: user clicks, gives feedback, or changes preferences
 * Supports both WebSocket and polling fallback
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { MlService } from '../modules/ml/ml.service';

interface ClientContext {
  userId: string;
  connectedAt: Date;
  preferences?: any;
  lastRecommendationsFetch?: Date;
}

@WebSocketGateway({
  namespace: 'recommendations',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class RecommendationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(RecommendationGateway.name);
  private clientContexts = new Map<string, ClientContext>();

  constructor(@Inject(MlService) private mlService: MlService) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket): Promise<void> {
    const userId = client.handshake.query.userId as string | undefined;

    if (!userId) {
      this.logger.warn('Client connected without userId');
      client.disconnect();
      return;
    }

    let preferences = {};
    const prefStr = client.handshake.query.preferences as string | undefined;
    if (prefStr) {
      try {
        preferences = JSON.parse(prefStr) as Record<string, unknown>;
      } catch {
        this.logger.warn('Invalid preferences JSON');
      }
    }

    const context: ClientContext = {
      userId,
      connectedAt: new Date(),
      preferences,
    };

    this.clientContexts.set(client.id, context);
    this.logger.log(`📱 Client connected: ${userId} (room: ${client.id})`);

    // Send initial recommendations on connection
    await this.sendRecommendations(client, userId);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket): void {
    const context = this.clientContexts.get(client.id);
    if (context) {
      this.logger.log(`📴 Client disconnected: ${context.userId}`);
      this.clientContexts.delete(client.id);
    }
  }

  /**
   * Client subscribes to updates for a specific user
   * Usage: client.emit('subscribe', { userId: 'user123' })
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    client: Socket,
    payload: { userId: string; preferences?: Record<string, unknown> },
  ): Promise<void> {
    const context = this.clientContexts.get(client.id);
    if (context) {
      context.userId = payload.userId;
      context.preferences = payload.preferences || {};
      this.logger.log(`✅ Subscribed to: ${payload.userId}`);
      await this.sendRecommendations(client, payload.userId);
    }
  }

  /**
   * Fetch fresh recommendations and send via WebSocket
   * Called on: initial connection, click, feedback, preference change
   */
  async sendRecommendations(client: Socket, userId: string) {
    try {
      const result =
        await this.mlService.getPersonalizedRecommendations(userId);
      const recommendations = result.recommendations;

      client.emit('recommendations:update', {
        timestamp: new Date().toISOString(),
        userId,
        recommendations,
        count: recommendations.length,
      });

      this.logger.debug(
        `📤 Sent ${recommendations.length} recommendations to ${userId}`,
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error fetching recommendations for ${userId}: ${errorMsg}`,
      );
      client.emit('error', {
        message: 'Failed to fetch recommendations',
        error: errorMsg,
      });
    }
  }

  /**
   * Broadcast update to all clients of a specific user
   * Called by RecommendationUpdateService when events occur
   */
  async broadcastUserUpdate(
    userId: string,
    trigger: 'click' | 'feedback' | 'preference',
  ) {
    const clientIds = Array.from(this.clientContexts.entries())
      .filter(([, ctx]) => ctx.userId === userId)
      .map(([clientId]) => clientId);

    if (clientIds.length === 0) {
      this.logger.debug(`No connected clients for user ${userId}`);
      return;
    }

    this.logger.log(
      `🔄 Broadcasting ${trigger} update to ${userId} (${clientIds.length} clients)`,
    );

    for (const clientId of clientIds) {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        await this.sendRecommendations(client, userId);
      }
    }
  }

  /**
   * Emit event (no update needed, just notification)
   */
  notifyEvent(
    userId: string,
    event: string,
    data: Record<string, unknown>,
  ): void {
    const clientIds = Array.from(this.clientContexts.entries())
      .filter(([, ctx]) => ctx.userId === userId)
      .map(([clientId]) => clientId);

    clientIds.forEach((clientId) => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit(event, data);
      }
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clientContexts.size;
  }

  /**
   * Get connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(
      new Set(
        Array.from(this.clientContexts.values()).map((ctx) => ctx.userId),
      ),
    );
  }
}
