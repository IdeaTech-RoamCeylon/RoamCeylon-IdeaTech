/**
 * Real-Time Recommendation Update Service
 * Watches for user clicks, feedback, and preference changes
 * Triggers WebSocket broadcasts and polling notifications
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient } from '@prisma/client';
import { RecommendationGateway } from '../../../gateways/recommendation.gateway';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class RecommendationUpdateService implements OnModuleInit {
  private logger = new Logger(RecommendationUpdateService.name);
  private prisma = new PrismaClient();

  constructor(
    private recommendationGateway: RecommendationGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.logger.log('🚀 Real-time recommendation updates initialized');
  }

  /**
   * Listen to recommendation click events
   * Trigger when user clicks a recommended item
   */
  @OnEvent('recommendation.clicked')
  async onRecommendationClicked(data: {
    userId: string;
    itemId: string;
    recommendationId: string;
    mlScore: number;
  }): Promise<void> {
    this.logger.log(
      `🖱️  Recommendation clicked: ${data.userId} → ${data.itemId}`,
    );

    try {
      // Update recommendation log as clicked
      await this.prisma.recommendationLog.update({
        where: { id: data.recommendationId },
        data: { clicked: true },
      });

      // Broadcast updated recommendations to user
      await this.recommendationGateway.broadcastUserUpdate(
        data.userId,
        'click',
      );

      // Notify about the interaction
      this.recommendationGateway.notifyEvent(data.userId, 'interaction', {
        type: 'click',
        itemId: data.itemId,
        timestamp: new Date().toISOString(),
        message: `You clicked on recommendation (${data.mlScore.toFixed(2)} score)`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in onRecommendationClicked: ${msg}`);
    }
  }

  /**
   * Listen to user feedback events
   * Trigger when user rates a recommendation
   */
  @OnEvent('feedback.submitted')
  async onFeedbackSubmitted(data: {
    userId: string;
    tripId?: string;
    feedbackValue: number;
    comment?: string;
  }): Promise<void> {
    this.logger.log(
      `⭐ Feedback submitted: ${data.userId} → ${data.feedbackValue}/5`,
    );

    try {
      // Get user's updated preferences after feedback processing
      const updated = await this.prisma.userInterestProfile.findUnique({
        where: { userId: data.userId },
      });

      if (updated) {
        this.logger.debug(
          `Updated profile for ${data.userId}: ` +
            `cultural=${updated.culturalScore.toFixed(2)}, ` +
            `adventure=${updated.adventureScore.toFixed(2)}, ` +
            `relaxation=${updated.relaxationScore.toFixed(2)}`,
        );
      }

      // Broadcast updated recommendations
      await this.recommendationGateway.broadcastUserUpdate(
        data.userId,
        'feedback',
      );

      // Notify about feedback impact
      this.recommendationGateway.notifyEvent(
        data.userId,
        'feedback_processed',
        {
          feedbackValue: data.feedbackValue,
          timestamp: new Date().toISOString(),
          message: `Feedback recorded. Your recommendations will be updated based on your rating.`,
        },
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in onFeedbackSubmitted: ${msg}`);
    }
  }

  /**
   * Listen to preference change events
   * Trigger when user updates their travel preferences
   */
  @OnEvent('preferences.updated')
  async onPreferencesUpdated(data: {
    userId: string;
    preferences: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(`⚙️  Preferences updated: ${data.userId}`);
    this.logger.debug('New preferences:', data.preferences);

    try {
      // Broadcast updated recommendations immediately
      await this.recommendationGateway.broadcastUserUpdate(
        data.userId,
        'preference',
      );

      // Notify about preference update
      this.recommendationGateway.notifyEvent(
        data.userId,
        'preferences_applied',
        {
          preferences: data.preferences,
          timestamp: new Date().toISOString(),
          message:
            'Your preferences have been updated. Recommendations refreshed.',
        },
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in onPreferencesUpdated: ${msg}`);
    }
  }

  /**
   * Listen to user behavior events for implicit feedback
   * Trigger on views, bookings, saves (optional advanced feature)
   */
  @OnEvent('behavior.recorded')
  async onBehaviorRecorded(data: {
    userId: string;
    eventType: string;
    itemId: string;
  }): Promise<void> {
    // Only update for high-signal events
    const highSignalEvents = [
      'trip_booked',
      'trip_saved',
      'destination_bookmarked',
    ];

    if (!highSignalEvents.includes(data.eventType)) {
      return;
    }

    this.logger.log(
      `📊 Behavior event (${data.eventType}): ${data.userId} → ${data.itemId}`,
    );

    try {
      // Broadcast for behavior-triggered updates
      await this.recommendationGateway.broadcastUserUpdate(
        data.userId,
        'preference',
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in onBehaviorRecorded: ${msg}`);
    }
  }

  async checkForUpdates(userId: string): Promise<{
    hasUpdates: boolean;
    lastUpdate: string;
    reason?: string;
  }> {
    try {
      // Check if user has recent events (last 5 seconds)
      const recentEvents = await this.prisma.userBehaviorEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 5000), // Last 5 seconds
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (recentEvents.length > 0) {
        return {
          hasUpdates: true,
          lastUpdate: recentEvents[0].createdAt.toISOString(),
          reason: recentEvents[0].eventType,
        };
      }

      // Check for recent feedback
      const recentFeedback = await this.prisma.plannerFeedback.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 5000),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (recentFeedback.length > 0) {
        return {
          hasUpdates: true,
          lastUpdate: recentFeedback[0].createdAt.toISOString(),
          reason: 'feedback',
        };
      }

      return {
        hasUpdates: false,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking updates for ${userId}: ${msg}`);
      return {
        hasUpdates: false,
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  /**
   * Get real-time status of WebSocket gateway
   */
  getGatewayStatus(): Record<string, unknown> {
    return {
      connectedClients: this.recommendationGateway.getConnectedClientsCount(),
      connectedUsers: this.recommendationGateway.getConnectedUsers(),
      gatewayStatus: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}
