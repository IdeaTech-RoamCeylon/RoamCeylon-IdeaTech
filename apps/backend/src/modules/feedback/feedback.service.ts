// modules/feedback/feedback.service.ts

import { Injectable } from '@nestjs/common';
import { FeedbackMappingService } from './feedback-mapping.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackMappingService: FeedbackMappingService,
  ) {}

  async submitFeedback(
    userId: string,
    tripId: string,
    feedbackValue: { rating: number },
  ) {
    await this.feedbackMappingService.processFeedback(
      userId,
      tripId,
      feedbackValue,
    );
  }
}
