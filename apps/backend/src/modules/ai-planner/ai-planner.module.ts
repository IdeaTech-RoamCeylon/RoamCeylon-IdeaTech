import { Module } from '@nestjs/common';
import { AiPlannerController } from './ai-planner.controller';
import { AiPlannerService } from './ai-planner.service';

@Module({
  controllers: [AiPlannerController],
<<<<<<< HEAD
  providers: [AiPlannerService]
=======
  providers: [AiPlannerService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class AiPlannerModule {}
