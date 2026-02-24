// apps/backend/src/modules/feedback/feedback.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackMappingService } from './feedback-mapping.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private readonly LEARNING_COOLDOWN_HOURS = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedbackMappingService: FeedbackMappingService,
  ) {}

  async submitFeedback(
    userId: string,
    tripId: string,
    rating: number,
    category?: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Feedback rating must be between 1 and 5');
    }

    const existing = await this.prisma.plannerFeedback.findUnique({
      where: {
        unique_user_trip_feedback: {
          userId,
          tripId,
        },
      },
    });

    const now = new Date();
    let shouldTriggerLearning = false;

    if (!existing) {
      // First submission
      shouldTriggerLearning = true;

      this.logger.log(
        `[Learning] First feedback submitted: user=${userId}, trip=${tripId}`,
      );
    } else {
      const previousRating = this.extractRating(existing.feedbackValue);

      const hoursSinceLastUpdate =
        (now.getTime() - existing.updatedAt.getTime()) / (1000 * 60 * 60);

      const ratingChanged = previousRating !== rating;
      const cooldownPassed =
        hoursSinceLastUpdate >= this.LEARNING_COOLDOWN_HOURS;

      if (ratingChanged && cooldownPassed) {
        shouldTriggerLearning = true;

        this.logger.log(
          `[Learning] Edit accepted: user=${userId}, trip=${tripId}, prev=${previousRating}, new=${rating}`,
        );
      } else {
        this.logger.warn(
          `[AntiGaming] Learning blocked: user=${userId}, trip=${tripId}, ratingChanged=${ratingChanged}, cooldownPassed=${cooldownPassed}`,
        );
      }
    }

    // Always save latest rating
    await this.prisma.plannerFeedback.upsert({
      where: {
        unique_user_trip_feedback: {
          userId,
          tripId,
        },
      },
      create: {
        userId,
        tripId,
        feedbackValue: { rating },
      },
      update: {
        feedbackValue: { rating },
        // DO NOT touch createdAt
      },
    });

    if (shouldTriggerLearning) {
      await this.feedbackMappingService.processFeedback(
        userId,
        rating,
        category,
      );
    }
  }

  private extractRating(raw: unknown): number | undefined {
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object' && 'rating' in raw) {
      const { rating } = raw as { rating: unknown };
      if (typeof rating === 'number') return rating;
    }
    return undefined;
  }
}
