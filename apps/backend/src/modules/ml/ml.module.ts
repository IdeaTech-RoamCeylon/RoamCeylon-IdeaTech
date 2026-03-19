import { Module } from '@nestjs/common';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeatureExtractionService } from './services/featureExtraction.service';
import { MlPredictionService } from './services/mlPrediction.service';

@Module({
  imports: [PrismaModule],
  controllers: [MlController],
  providers: [MlService, FeatureExtractionService, MlPredictionService],
  exports: [MlService, FeatureExtractionService, MlPredictionService],
})
export class MlModule {}
