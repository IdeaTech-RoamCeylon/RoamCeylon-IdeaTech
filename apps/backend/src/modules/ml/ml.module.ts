import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeatureExtractionService } from './services/featureExtraction.service';
import { MlPredictionService } from './services/mlPrediction.service';
import { RecommendationUpdateService } from './services/recommendationUpdate.service';
import { RecommendationUpdateController } from './controllers/recommendationUpdate.controller';
import { RecommendationGateway } from '../../gateways/recommendation.gateway';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IncrementalLearningService } from './services/incremental-learning.service';
import { ModelRetrainingService } from './services/model-retraining.service';
import { AIModule } from '../ai/ai.module';

// Day 65 & 66 new services
import { RecommendationCacheService } from './services/recommendation-cache.service';
import { BackgroundQueueService } from './services/background-queue.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { RetryService } from './services/retry.service';
import { DbOptimizationService } from './services/db-optimization.service';

@Module({
  imports: [
    PrismaModule,
    AnalyticsModule,
    EventEmitterModule.forRoot(),
    AIModule,
  ],
  controllers: [MlController, RecommendationUpdateController],
  providers: [
    MlService,
    FeatureExtractionService,
    MlPredictionService,
    RecommendationUpdateService,
    RecommendationGateway,
    IncrementalLearningService,
    ModelRetrainingService,
    // Day 65 & 66 new services
    RecommendationCacheService,
    BackgroundQueueService,
    CircuitBreakerService,
    RetryService,
    DbOptimizationService,
  ],
  exports: [
    MlService,
    FeatureExtractionService,
    MlPredictionService,
    RecommendationUpdateService,
    RecommendationGateway,
    IncrementalLearningService,
    ModelRetrainingService,
    // Day 65 & 66 new services
    RecommendationCacheService,
    BackgroundQueueService,
    CircuitBreakerService,
    RetryService,
    DbOptimizationService,
  ],
})
export class MlModule {}
