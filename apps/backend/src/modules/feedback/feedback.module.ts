// modules/feedback/feedback.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeedbackService } from './feedback.service';
import { FeedbackMappingService } from './feedback-mapping.service';
import { RankingService } from './ranking.service';

@Module({
  imports: [PrismaModule],
  providers: [FeedbackService, FeedbackMappingService, RankingService],
  exports: [FeedbackService, RankingService],
})
export class FeedbackModule {}
