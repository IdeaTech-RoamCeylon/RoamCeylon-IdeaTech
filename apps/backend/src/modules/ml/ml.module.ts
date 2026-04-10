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

@Module({
  imports: [PrismaModule, AnalyticsModule, EventEmitterModule.forRoot()],
  controllers: [MlController, RecommendationUpdateController],
  providers: [
    MlService,
    FeatureExtractionService,
    MlPredictionService,
    RecommendationUpdateService,
    RecommendationGateway,
  ],
  exports: [
    MlService,
    FeatureExtractionService,
    MlPredictionService,
    RecommendationUpdateService,
    RecommendationGateway,
  ],
})
export class MlModule {}
