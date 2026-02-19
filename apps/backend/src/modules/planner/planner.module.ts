import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { PlannerAggregationService } from './planner-aggregation.service';
import { PlannerRankingService } from './planner-ranking.service';
import { PlannerMetricsInterceptor } from './interceptors/planner-metrics.interceptor';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [CacheModule.register(), FeedbackModule],
  controllers: [PlannerController],
  providers: [
    PlannerService,
    PlannerAggregationService,
    PlannerRankingService,
    PlannerMetricsInterceptor,
  ],
})
export class PlannerModule {}
