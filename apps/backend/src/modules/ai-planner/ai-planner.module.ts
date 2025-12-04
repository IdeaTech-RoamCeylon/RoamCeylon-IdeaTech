import { Module } from '@nestjs/common';
import { AiPlannerController } from './ai-planner.controller';
import { AiPlannerService } from './ai-planner.service';

@Module({
  controllers: [AiPlannerController],
  providers: [AiPlannerService]
})
export class AiPlannerModule {}
