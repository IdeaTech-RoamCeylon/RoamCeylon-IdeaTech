// apps/backend/src/modules/feedback/feedback.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackMappingService } from './feedback-mapping.service';
import { FeedbackQueueService } from './feedback-queue.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private readonly LEARNING_COOLDOWN_HOURS = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedbackMappingService: FeedbackMappingService,
    private readonly feedbackQueueService: FeedbackQueueService,
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
      where: { unique_user_trip_feedback: { userId, tripId } },
    });

    const now = new Date();
    let shouldTriggerLearning = false;
    let shouldQueueLearning = false;

    if (!existing) {
      // ── First submission — always learn immediately ────────────────────────
      shouldTriggerLearning = true;
      this.logger.log(
        `[Learning] First feedback: userId=${userId} tripId=${tripId} rating=${rating}`,
      );
    } else {
      const previousRating = this.extractRating(existing.feedbackValue);
      const hoursSinceLastUpdate =
        (now.getTime() - existing.updatedAt.getTime()) / (1000 * 60 * 60);
      const ratingChanged = previousRating !== rating;
      const cooldownPassed =
        hoursSinceLastUpdate >= this.LEARNING_COOLDOWN_HOURS;

      if (!ratingChanged) {
        // ── Same rating resubmitted — no learning needed ───────────────────
        this.logger.log(
          `[AntiGaming] Same rating resubmitted, skipping: userId=${userId}`,
        );
      } else if (cooldownPassed) {
        // ── Rating changed AND cooldown passed — learn immediately ─────────
        shouldTriggerLearning = true;
        this.logger.log(
          `[Learning] Edit accepted after cooldown: userId=${userId} ` +
            `prev=${previousRating} new=${rating}`,
        );
      } else {
        // ── Rating changed but cooldown NOT passed ─────────────────────────
        // Queue for deferred learning — don't silently drop it
        shouldQueueLearning = true;
        const hoursRemaining = (
          this.LEARNING_COOLDOWN_HOURS - hoursSinceLastUpdate
        ).toFixed(1);
        this.logger.log(
          `[AntiGaming] Rating changed within cooldown — queuing deferred learning: ` +
            `userId=${userId} tripId=${tripId} ` +
            `prev=${previousRating} new=${rating} ` +
            `cooldownRemaining=${hoursRemaining}h`,
        );
      }
    }

    // ── Always save the latest rating ──────────────────────────────────────
    await this.prisma.plannerFeedback.upsert({
      where: { unique_user_trip_feedback: { userId, tripId } },
      create: { userId, tripId, feedbackValue: { rating } },
      update: { feedbackValue: { rating } },
    });

    // ── Trigger immediate learning ──────────────────────────────────────────
    if (shouldTriggerLearning && category) {
      await this.feedbackMappingService.processFeedback(
        userId,
        rating,
        category,
      );

      // Drift detection (non-blocking)
      this.checkSystemDriftWarning().catch((err) =>
        this.logger.error('Failed to run drift detection', err),
      );

      // Remove any pending queued entry for this trip since we just learned
      // from a direct submission — no need to process it again later
      await this.prisma.pendingFeedbackLearning
        .delete({ where: { userId_tripId: { userId, tripId } } })
        .catch(() => {
          /* entry may not exist, ignore */
        });
    }

    // ── Queue deferred learning ─────────────────────────────────────────────
    if (shouldQueueLearning && category) {
      await this.feedbackQueueService.queue(
        userId,
        tripId,
        rating,
        category,
        this.LEARNING_COOLDOWN_HOURS,
      );
    }

    return {
      learned: shouldTriggerLearning,
      queued: shouldQueueLearning,
    };
  }

  // ─── Drift detection ────────────────────────────────────────────────────────

  private async checkSystemDriftWarning(): Promise<void> {
    const allFeedback = await this.prisma.plannerFeedback.findMany({
      select: { feedbackValue: true },
    });

    const MINIMUM_FEEDBACK_COUNT = 50;
    const DRIFT_THRESHOLD_PERCENT = 70;

    if (allFeedback.length < MINIMUM_FEEDBACK_COUNT) return;

    let positiveCount = 0;
    let validCount = 0;

    for (const item of allFeedback) {
      const rating = this.extractRating(item.feedbackValue);
      if (rating !== undefined) {
        validCount++;
        if (rating >= 4) positiveCount++;
      }
    }

    if (validCount < MINIMUM_FEEDBACK_COUNT) return;

    const positivityRate = (positiveCount / validCount) * 100;

    if (positivityRate < DRIFT_THRESHOLD_PERCENT) {
      this.logger.warn(
        `🚨 AI DRIFT WARNING: Positivity dropped to ${positivityRate.toFixed(1)}% ` +
          `(${positiveCount}/${validCount})`,
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
