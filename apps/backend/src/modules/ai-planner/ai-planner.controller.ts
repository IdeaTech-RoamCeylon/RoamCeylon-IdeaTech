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
    } catch (error) {
      // FIX: Check if the error is actually an instance of Error before accessing .message
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return { message: 'Seeding failed', error: errorMessage };
    }
  }
}
