// apps/backend/src/modules/analytics/analytics.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/planner/daily
   * Returns planner event counts for today, grouped by event type.
   */
  @Get('planner/daily')
  async getPlannerDailyStats() {
    return this.analyticsService.getPlannerDailyStats();
  }

  /**
   * GET /analytics/feedback/rate
   * Returns feedback submission rate and 7-day breakdown.
   */
  @Get('feedback/rate')
  async getFeedbackRate() {
    return this.analyticsService.getFeedbackRate();
  }

  /**
   * GET /analytics/system/errors
   * Returns system error count and error rate for the last 24 hours.
   */
  @Get('system/errors')
  async getSystemErrors() {
    return this.analyticsService.getSystemErrors();
  }
}
