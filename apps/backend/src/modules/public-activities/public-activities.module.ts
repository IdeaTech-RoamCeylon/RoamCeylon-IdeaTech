import { Module } from '@nestjs/common';
import { PublicActivitiesController } from './public-activities.controller';
import { PublicActivitiesService } from './public-activities.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicActivitiesController],
  providers: [PublicActivitiesService],
  exports: [PublicActivitiesService],
})
export class PublicActivitiesModule {}
