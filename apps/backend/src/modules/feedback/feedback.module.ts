// modules/feedback/feedback.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeedbackService } from './feedback.service';
import { FeedbackMappingService } from './feedback-mapping.service';
import { RankingService } from './ranking.service';
import { BiasMonitorService } from './bias-monitor.service';
import { AggregationValidatorService } from './aggregation-validator.service';

@Module({
  imports: [PrismaModule],
  providers: [
    FeedbackService,
    FeedbackMappingService,
    RankingService,
    BiasMonitorService,
    AggregationValidatorService,
  ],
  exports: [
    FeedbackService,
    FeedbackMappingService,
    RankingService,
    BiasMonitorService,
    AggregationValidatorService,
  ],
})
export class FeedbackModule {}
