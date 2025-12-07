import { Controller, Get, Post } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';

@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Get('health')
  getHealth() {
    return 'AI Planner Module Operational';
  }

 @Post('seed')
 async seedDatabase() {
   try {
     await this.aiPlannerService.seedEmbeddingsFromAiPlanner();
     return { message: 'Seeding completed successfully!' };
   } catch (error: any) {
     return { message: 'Seeding failed', error: error.message || 'Unknown error' };
   }
 }

}


