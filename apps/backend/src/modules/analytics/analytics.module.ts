// apps/backend/src/modules/analytics/analytics.module.ts

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { LatencyTrackerService } from './latency-tracker.service';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  providers: [AnalyticsService, LatencyTrackerService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, LatencyTrackerService],
})
export class AnalyticsModule {}
