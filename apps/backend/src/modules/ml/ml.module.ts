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
  ],
  exports: [
    MlService,
    FeatureExtractionService,
    MlPredictionService,
    RecommendationUpdateService,
    RecommendationGateway,
    IncrementalLearningService,
    ModelRetrainingService,
  ],
})
export class MlModule {}
