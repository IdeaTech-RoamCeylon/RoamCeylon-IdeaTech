import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MlService } from './ml.service';
import { TrackBehaviorDto } from './dto/track-behavior.dto';
import {
  MlPredictionService,
  MLPredictionRequest,
} from './services/mlPrediction.service';
import { LatencyTrackerService } from '../analytics/latency-tracker.service';

@Controller('api')
export class MlController {
  constructor(
    private readonly mlService: MlService,
    private readonly mlPredictionService: MlPredictionService,
    private readonly latencyTracker: LatencyTrackerService,
  ) {}

  @Post('ml/recommendations')
  async getMLRecommendations(@Body() body: MLPredictionRequest) {
    return this.latencyTracker.measure(
      {
        endpoint: '/api/ml/recommendations',
        method: 'POST',
        userId: body.user_id,
      },
      async () => {
        const result =
          await this.mlPredictionService.getMLRecommendations(body);
        if (!result) return { recommendations: [] };
        return result;
      },
    );
  }

  @Post('behavior/track')
  async trackBehavior(@Body() dto: TrackBehaviorDto) {
    return this.latencyTracker.measure(
      {
        endpoint: '/api/behavior/track',
        method: 'POST',
        userId: dto.user_id,
      },
      () => this.mlService.trackBehavior(dto),
    );
  }

  @Get('recommendations/personalized')
  async getPersonalizedRecommendations(@Query('userId') userId?: string) {
    const uid = userId ?? 'admin';
    return this.latencyTracker.measure(
      {
        endpoint: '/api/recommendations/personalized',
        method: 'GET',
        userId: uid,
      },
      () => this.mlService.getPersonalizedRecommendations(uid),
    );
  }
}
