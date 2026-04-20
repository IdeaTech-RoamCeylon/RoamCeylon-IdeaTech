/**
 * Real-Time Recommendation Update Controller
 * Exposes endpoints to trigger recommendation updates
 * Integrates with WebSocket gateway and polling service
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecommendationUpdateService } from '../services/recommendationUpdate.service';
import { RecommendationGateway } from '../../../gateways/recommendation.gateway';

@Controller('api/recommendations')
export class RecommendationUpdateController {
  private logger = new Logger(RecommendationUpdateController.name);

  constructor(
    private updateService: RecommendationUpdateService,
    private gateway: RecommendationGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * POST /api/recommendations/click
   * Record when user clicks a recommendation
   * Triggers: broadcast of new recommendations to user
   */
  @Post('click')
  recordRecommendationClick(
    @Body()
    payload: {
      userId: string;
      recommendationId: string;
      itemId: string;
      mlScore: number;
    },
  ): Record<string, unknown> {
    this.logger.log(`Recording click: ${payload.userId} → ${payload.itemId}`);

    try {
      // Emit event that triggers WebSocket broadcast
      this.eventEmitter.emit('recommendation.clicked', {
        userId: payload.userId,
        itemId: payload.itemId,
        recommendationId: payload.recommendationId,
        mlScore: payload.mlScore,
      });

      return {
        success: true,
        message: 'Click recorded. Updating recommendations...',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error recording click: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * POST /api/recommendations/feedback
   * Record user feedback and trigger updates
   * Triggers: broadcast of new recommendations based on feedback
   */
  @Post('feedback')
  async recordFeedbackUpdate(
    @Body()
    payload: {
      userId: string;
      tripId?: string;
      feedbackValue: number;
      comment?: string;
    },
  ): Promise<Record<string, unknown>> {
    this.logger.log(
      `Recording feedback: ${payload.userId} → ${payload.feedbackValue}/5`,
    );

    try {
      // Emit event (actual feedback processing happens in FeedbackService)
      this.eventEmitter.emit('feedback.submitted', {
        userId: payload.userId,
        tripId: payload.tripId,
        feedbackValue: payload.feedbackValue,
        comment: payload.comment,
      });

      // Also manually trigger update immediately for real-time feel
      await this.gateway.broadcastUserUpdate(payload.userId, 'feedback');

      return {
        success: true,
        message: 'Feedback recorded. Recommendations updated.',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error recording feedback: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * POST /api/recommendations/preferences
   * Update user preferences and trigger recommendation refresh
   * Triggers: broadcast of new recommendations based on preferences
   */
  @Post('preferences')
  async updatePreferences(
    @Body()
    payload: {
      userId: string;
      preferences: Record<string, unknown>;
    },
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Updating preferences for ${payload.userId}`);

    try {
      // Emit preference update event
      this.eventEmitter.emit('preferences.updated', {
        userId: payload.userId,
        preferences: payload.preferences,
      });

      // Trigger immediate update
      await this.gateway.broadcastUserUpdate(payload.userId, 'preference');

      return {
        success: true,
        message: 'Preferences updated. Recommendations refreshed.',
        preferences: payload.preferences,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error updating preferences: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * GET /api/recommendations/updates/:userId
   * Polling endpoint for clients without WebSocket support
   * Returns whether updates are available since last check
   *
   * Usage:
   *   GET /api/recommendations/updates/user123?lastCheck=2026-04-09T14:23:00Z
   */
  @Get('updates/:userId')
  async checkUpdates(
    @Param('userId') userId: string,
    @Query('lastCheck') lastCheck?: string,
  ): Promise<Record<string, unknown>> {
    try {
      const status = await this.updateService.checkForUpdates(userId);
      return {
        success: true,
        ...status,
        lastCheckTime: lastCheck || 'none',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking updates: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * GET /api/recommendations/gateway/status
   * Get real-time status of WebSocket gateway
   * Admin endpoint to monitor active connections
   */
  @Get('gateway/status')
  getGatewayStatus(): Record<string, unknown> {
    return this.updateService.getGatewayStatus();
  }

  /**
   * POST /api/recommendations/behavior
   * Record implicit user behavior (views, bookmarks, etc.)
   * Used for implicit feedback signals
   */
  @Post('behavior')
  recordBehavior(
    @Body()
    payload: {
      userId: string;
      eventType: string;
      itemId: string;
    },
  ): Record<string, unknown> {
    this.logger.log(
      `Recording behavior: ${payload.userId} (${payload.eventType}) → ${payload.itemId}`,
    );

    try {
      // Emit behavior event
      this.eventEmitter.emit('behavior.recorded', {
        userId: payload.userId,
        eventType: payload.eventType,
        itemId: payload.itemId,
      });

      return {
        success: true,
        message: `Behavior recorded: ${payload.eventType}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error recording behavior: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
