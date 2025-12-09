import { Controller, Get, Post, Logger } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';

@Controller('ai')
export class AiPlannerController {
  private readonly logger = new Logger(AiPlannerController.name);

  constructor(private readonly aiPlannerService: AiPlannerService) { }

  @Get('health')
  getHealth() {
    this.logger.log('AI Planner health check triggered');
    return 'AI Planner Module Operational';
  }

  @Post('seed')
  async seedDatabase() {
    this.logger.log('AI Planner seed database triggered');
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
