import { Module } from '@nestjs/common';
import { TourGuideController } from './tour-guide.controller';
import { PublicTourController } from './public-tour.controller';
import { TourGuideService } from './tour-guide.service';

@Module({
  controllers: [TourGuideController, PublicTourController],
  providers: [TourGuideService],
  exports: [TourGuideService],
})
export class TourGuideModule {}
