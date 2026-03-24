import { Module } from '@nestjs/common';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeatureExtractionService } from './services/featureExtraction.service';
import { MlPredictionService } from './services/mlPrediction.service';

import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [MlController],
  providers: [MlService, FeatureExtractionService, MlPredictionService],
  exports: [MlService, FeatureExtractionService, MlPredictionService],
})
export class MlModule {}
