import { Controller, Get, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { CreatePlanDto, ItineraryResponse } from './dto/create-ai-planner.dto';

@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) { }

  @Get('health')
  getHealth() {
    return 'AI Planner Module Operational';
  }

  @Post('plan')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async generatePlan(@Body() dto: CreatePlanDto): Promise<ItineraryResponse> {
    return this.aiPlannerService.createPlan(dto);
  }

  @Post('seed')
  async seedDatabase() {
    try {
      await this.aiPlannerService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return { message: 'Seeding failed', error: errorMessage };
    }
  }
}
