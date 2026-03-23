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
          `├─────────────────────────────────────────────────────┤\n` +
          `│  userId   : ${userId}  │\n` +
          `│  tripId   : ${tripId}  │\n` +
          `│  category : ${category.padEnd(10)}                           │\n` +
          `│  old rating : ${existing.rating} → new rating : ${rating} ${ratingLabel.padEnd(12)}    │\n` +
          `│  processAfter : ${processAfter.toISOString()}  │\n` +
          `│  ⚠️  Previous queued rating discarded                │\n` +
          `└─────────────────────────────────────────────────────┘`,
      );
    } else {
      // New entry added to queue
      this.logger.log(
        `\n` +
          `┌─────────────────────────────────────────────────────┐\n` +
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

  // ─── Scheduled processor ────────────────────────────────────────────────────

  /**
   * Runs every hour and processes all queue entries whose cooldown has expired.
   *
   * For each expired entry:
   * 1. Calls processFeedback() to update CategoryWeight + TrustScore
   * 2. Deletes the processed entry from the queue
   *
   * Processes in batches of 50 to avoid long-running transactions.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processExpiredQueue(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.pendingFeedbackLearning.findMany({
      where: { processAfter: { lte: now } },
      orderBy: { processAfter: 'asc' },
      take: 50, // batch size — prevents overloading on backlog
    });

    if (expired.length === 0) return;

    this.logger.log(
      `\n` +
        `┌─────────────────────────────────────────────────────┐\n` +
        `│  ⏰ DEFERRED LEARNING QUEUE — PROCESSING            │\n` +
        `│  ${expired.length} entries ready to learn from               │\n` +
        `└─────────────────────────────────────────────────────┘`,
    );

    let processed = 0;
    let failed = 0;

    for (const entry of expired) {
      const ratingLabel =
        entry.rating >= 4
          ? '⭐ Positive'
          : entry.rating <= 2
            ? '👎 Negative'
            : '😐 Neutral';
      const waitedMs = Date.now() - entry.queuedAt.getTime();
      const waitedHours = (waitedMs / (1000 * 60 * 60)).toFixed(1);

      try {
        // Apply deferred learning
        await this.feedbackMappingService.processFeedback(
          entry.userId,
          entry.rating,
          entry.category,
        );

        // Remove from queue after successful processing
        await this.prisma.pendingFeedbackLearning.delete({
          where: { id: entry.id },
        });

        processed++;

        this.logger.log(
          `\n` +
            `┌─────────────────────────────────────────────────────┐\n` +
            `│  ✅ DEFERRED LEARNING APPLIED                        │\n` +
            `├─────────────────────────────────────────────────────┤\n` +
            `│  userId   : ${entry.userId}  │\n` +
            `│  category : ${entry.category.padEnd(10)}                           │\n` +
            `│  rating   : ${entry.rating} ${ratingLabel.padEnd(20)}              │\n` +
            `│  waited   : ${waitedHours}h since queued                     │\n` +
            `│  CategoryWeight + TrustScore updated ✅              │\n` +
            `└─────────────────────────────────────────────────────┘`,
        );
      } catch (err) {
        failed++;
        this.logger.error(
          `\n` +
            `┌─────────────────────────────────────────────────────┐\n` +
            `│  ❌ DEFERRED LEARNING FAILED — will retry next hour  │\n` +
            `├─────────────────────────────────────────────────────┤\n` +
            `│  entry id : ${entry.id}                                  │\n` +
            `│  userId   : ${entry.userId}  │\n` +
            `│  error    : ${(err as Error).message.substring(0, 40).padEnd(40)}  │\n` +
            `└─────────────────────────────────────────────────────┘`,
        );
        // Don't delete on failure — will retry next hour
      }
    }

    this.logger.log(
      `\n` +
        `┌─────────────────────────────────────────────────────┐\n` +
        `│  📊 QUEUE BATCH COMPLETE                            │\n` +
        `│  ✅ processed : ${String(processed).padEnd(3)}                              │\n` +
        `│  ❌ failed    : ${String(failed).padEnd(3)} (will retry next hour)     │\n` +
        `└─────────────────────────────────────────────────────┘`,
    );
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
