// apps/backend/src/modules/feedback/feedback.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackMappingService } from './feedback-mapping.service';

@Injectable()
export class FeedbackService {
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

    // Upsert feedback (matches @@unique([userId, tripId]))
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
      },
    });

    await this.feedbackMappingService.processFeedback(
      userId,
      tripId,
      rating,
      category,
    );
  }
}
