// apps/backend/src/modules/feedback/feedback.module.ts

import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackMappingService } from './feedback-mapping.service';
import { FeedbackQueueService } from './feedback-queue.service';
import { FeedbackRankingService } from './ranking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    FeedbackService,
    FeedbackMappingService,
    FeedbackQueueService,
    FeedbackRankingService,
  ],
  exports: [
    FeedbackService,
    FeedbackMappingService,
    FeedbackQueueService,
    FeedbackRankingService,
  ],
})
export class FeedbackModule {}
