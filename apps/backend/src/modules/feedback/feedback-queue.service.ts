// apps/backend/src/modules/feedback/feedback-queue.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackMappingService } from './feedback-mapping.service';

@Injectable()
export class FeedbackQueueService {
  private readonly logger = new Logger(FeedbackQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedbackMappingService: FeedbackMappingService,
  ) {}

  // ─── Queue a deferred learning entry ────────────────────────────────────────

  /**
   * Queues a rating change for deferred learning after the cooldown period.
   * Uses upsert so only the LATEST pending rating per (userId, tripId) is kept.
   * This prevents gaming — if a user spams rating changes, only the final
   * rating is learned from after cooldown.
   *
   * Called by feedback.service.ts when:
   *   - ratingChanged = true
   *   - cooldownPassed = false
   */
  async queue(
    userId: string,
    tripId: string,
    rating: number,
    category: string,
    cooldownHours: number,
  ): Promise<void> {
    const processAfter = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

    // Check if there was already a pending entry to log overwrite
    const existing = await this.prisma.pendingFeedbackLearning.findUnique({
      where: { userId_tripId: { userId, tripId } },
    });

    await this.prisma.pendingFeedbackLearning.upsert({
      where: { userId_tripId: { userId, tripId } },
      create: {
        userId,
        tripId,
        rating,
        category,
        processAfter,
      },
      update: {
        // Overwrite with latest rating — user changed their mind again
        rating,
        category,
        queuedAt: new Date(),
        processAfter,
      },
    });

    const ratingLabel =
      rating >= 4 ? '⭐ Positive' : rating <= 2 ? '👎 Negative' : '😐 Neutral';

    if (existing) {
      // Existing entry was overwritten — user changed rating again
      this.logger.warn(
        `\n` +
          `┌─────────────────────────────────────────────────────┐\n` +
          `│  🔄 QUEUE ENTRY OVERWRITTEN (rating changed again)  │\n` +
          `│  userId   : ${userId}                               │\n` +
          `│  tripId   : ${tripId}                               │\n` +
          `│  category : ${category}                             │\n` +
          `│  old → new rating : ${existing.rating} → ${rating}  │\n` +
          `└─────────────────────────────────────────────────────┘`,
      );
    } else {
      // New entry added to queue
      this.logger.log(
        `\n┌─────────────────────────────────────────────────────┐\n` +
          `│  📥 QUEUED FOR DEFERRED LEARNING                    │\n` +
          `├─────────────────────────────────────────────────────┤\n` +
          `│  userId   : ${userId}  │\n` +
          `│  tripId   : ${tripId}  │\n` +
          `│  category : ${category.padEnd(10)}                           │\n` +
          `│  rating   : ${rating} ${ratingLabel.padEnd(20)}              │\n` +
          `│  reason   : Rating changed within 24h cooldown      │\n` +
          `│  will learn at : ${processAfter.toISOString()}  │\n` +
          `└─────────────────────────────────────────────────────┘`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // CRON PROCESSOR (ENV SAFE FIX)
  // ─────────────────────────────────────────────
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'feedback-queue-processor',
    disabled: process.env.NODE_ENV === 'test', // 🔥 KEY FIX
  })
  async processExpiredQueue(): Promise<void> {
    try {
      const now = new Date();

      const expired = await this.prisma.pendingFeedbackLearning.findMany({
        where: { processAfter: { lte: now } },
        orderBy: { processAfter: 'asc' },
        take: 50,
      });

      if (!expired?.length) return;

      this.logger.log(
        `\n┌─────────────────────────────────────────────────────┐\n` +
          `│  ⏰ PROCESSING QUEUE                                │\n` +
          `│  entries: ${expired.length}                          │\n` +
          `└─────────────────────────────────────────────────────┘`,
      );

      let processed = 0;
      let failed = 0;

      for (const entry of expired) {
        try {
          await this.feedbackMappingService.processFeedback(
            entry.userId,
            entry.rating,
            entry.category,
          );

          await this.prisma.pendingFeedbackLearning.delete({
            where: { id: entry.id },
          });

          processed++;
        } catch (err) {
          failed++;

          this.logger.error(
            `Queue failed id=${entry.id} error=${(err as Error).message}`,
          );
        }
      }

      this.logger.log(
        `Queue complete → processed=${processed}, failed=${failed}`,
      );
    } catch (err) {
      // NEVER crash cron or Jest
      this.logger.error(
        `processExpiredQueue crashed: ${(err as Error).message}`,
      );
    }
  }

  // ─── Manual trigger (for testing / admin) ───────────────────────────────────

  /**
   * Manually trigger queue processing — useful for testing without waiting 1h.
   * Call via: feedbackQueueService.processExpiredQueue()
   * Or expose as an admin endpoint if needed.
   */
  async getQueueStatus(): Promise<{
    pending: number;
    readyToProcess: number;
    nextProcessAt: Date | null;
  }> {
    const now = new Date();

    const [pending, readyToProcess, next] = await Promise.all([
      this.prisma.pendingFeedbackLearning.count(),
      this.prisma.pendingFeedbackLearning.count({
        where: { processAfter: { lte: now } },
      }),
      this.prisma.pendingFeedbackLearning.findFirst({
        where: { processAfter: { gt: now } },
        orderBy: { processAfter: 'asc' },
        select: { processAfter: true },
      }),
    ]);

    return {
      pending,
      readyToProcess,
      nextProcessAt: next?.processAfter ?? null,
    };
  }
}
