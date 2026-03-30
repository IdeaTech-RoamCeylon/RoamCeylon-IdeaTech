/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cron = require('node-cron');

const prisma = new PrismaClient(); // Or use a persistent PrismaService if available

@Injectable()
export class FeatureExtractionService implements OnModuleInit {
  private readonly logger = new Logger(FeatureExtractionService.name);

  onModuleInit() {
    this.logger.log('Initializing Feature Extraction Cron Job...');
    cron.schedule('0 */12 * * *', async () => {
      this.logger.log('Running scheduled feature extraction job...');
      await this.generateUserFeatures();
    });
  }

  async generateUserFeatures(userId?: string) {
    this.logger.log(
      `Starting feature extraction pipeline${userId ? ` for user ${userId}` : ''}...`,
    );

    try {
      // 1. Fetch user events
      const events = await (prisma as any).userBehaviorEvent.findMany({
        where: userId ? { userId } : undefined,
      });

      if (!events.length) {
        this.logger.log('No new events to process.');
        return;
      }

      // 2. Group by user and category
      const userCategoryCounts = new Map<string, any>();
      const feedbackCounts = new Map<
        string,
        { positive: number; negative: number }
      >();
      const destinationScores = new Map<
        string,
        { category: string; popularity: number }
      >();

      for (const event of events) {
        const uid = event.userId;
        const metadata = (event.metadata as Record<string, unknown>) || {};

        // Ensure data quality: Handle missing metadata and normalize categories
        if (!metadata) continue;

        const rawCategory = metadata['category'];
        const rawDestinationId = metadata['destinationId'];

        const category =
          typeof rawCategory === 'string'
            ? rawCategory.toLowerCase().trim()
            : null;
        const destinationId =
          typeof rawDestinationId === 'string' ? rawDestinationId : null;

        // Process time of day
        if (!userCategoryCounts.has(uid)) {
          userCategoryCounts.set(uid, {
            cultural: 0,
            adventure: 0,
            relaxation: 0,
            timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
            totalInteractions: 0,
          });
        }
        const userCounts = userCategoryCounts.get(uid)!;

        // Track time of day interaction patterns
        const hour = new Date(event.createdAt).getHours();
        if (hour >= 5 && hour < 12) userCounts.timeOfDay.morning += 1;
        else if (hour >= 12 && hour < 17) userCounts.timeOfDay.afternoon += 1;
        else if (hour >= 17 && hour < 22) userCounts.timeOfDay.evening += 1;
        else userCounts.timeOfDay.night += 1;

        userCounts.totalInteractions += 1;

        // Count category interactions
        if (category) {
          if (category.includes('cultur')) userCounts.cultural += 1;
          else if (category.includes('adventur')) userCounts.adventure += 1;
          else if (category.includes('relax')) userCounts.relaxation += 1;
        }

        // Count feedback
        if (event.eventType === 'feedback') {
          if (!feedbackCounts.has(uid)) {
            feedbackCounts.set(uid, { positive: 0, negative: 0 });
          }
          const userFeedback = feedbackCounts.get(uid)!;

          const rawRating = metadata['rating'];
          const rawType = metadata['type'];
          const rating = typeof rawRating === 'number' ? rawRating : 0;

          if (rating > 3 || rawType === 'positive') userFeedback.positive += 1;
          else if ((rating > 0 && rating <= 3) || rawType === 'negative')
            userFeedback.negative += 1;
        }

        // Destination popularity score
        if (destinationId && category) {
          if (!destinationScores.has(destinationId)) {
            destinationScores.set(destinationId, { category, popularity: 0 });
          }
          const dest = destinationScores.get(destinationId)!;
          // E.g., a trip_click gives +1 pointing to that destination's popularity
          if (event.eventType === 'trip_click' || event.eventType === 'view')
            dest.popularity += 1;
          else if (event.eventType === 'save') dest.popularity += 3;
        }
      }

      // 3. Update feature tables

      // Update User Interest Profiles
      for (const [uid, scores] of userCategoryCounts) {
        // Calculate Category Diversity Score
        // Shannon Entropy-inspired diversity calculation
        const totalCat = scores.cultural + scores.adventure + scores.relaxation;
        let diversity = 0;
        if (totalCat > 0) {
          const pC = scores.cultural / totalCat;
          const pA = scores.adventure / totalCat;
          const pR = scores.relaxation / totalCat;
          if (pC > 0) diversity -= pC * Math.log2(pC);
          if (pA > 0) diversity -= pA * Math.log2(pA);
          if (pR > 0) diversity -= pR * Math.log2(pR);
          // Normalize (max entropy for 3 categories is approx 1.58)
          diversity = Math.min(diversity / 1.58, 1.0);
        }

        await (prisma as any).userInterestProfile.upsert({
          where: { userId: uid },
          create: {
            userId: uid,
            culturalScore: scores.cultural,
            adventureScore: scores.adventure,
            relaxationScore: scores.relaxation,
            timeOfDayPrefs: scores.timeOfDay,
            categoryDiversity: diversity,
          },
          update: {
            culturalScore: { increment: scores.cultural },
            adventureScore: { increment: scores.adventure },
            relaxationScore: { increment: scores.relaxation },
            timeOfDayPrefs: scores.timeOfDay,
            categoryDiversity: diversity,
            updatedAt: new Date(),
          },
        });
      }

      // Update Destination Category Scores
      for (const [destId, data] of destinationScores) {
        await (prisma as any).destinationCategoryScore.upsert({
          where: { destinationId: destId },
          create: {
            destinationId: destId,
            category: data.category,
            popularityScore: data.popularity,
          },
          update: {
            popularityScore: { increment: data.popularity },
            updatedAt: new Date(),
          },
        });
      }

      // Update Feedback Summary
      for (const [uid, feedback] of feedbackCounts) {
        await (prisma as any).feedbackSummary.upsert({
          where: { userId: uid },
          create: {
            userId: uid,
            positiveFeedback: feedback.positive,
            negativeFeedback: feedback.negative,
          },
          update: {
            positiveFeedback: { increment: feedback.positive },
            negativeFeedback: { increment: feedback.negative },
            updatedAt: new Date(),
          },
        });
      }

      this.logger.log(
        `Successfully generated ML features${userId ? ` for user ${userId}` : ''}.`,
      );
    } catch (error) {
      this.logger.error('Error generating user features', error);
    }
  }
}
