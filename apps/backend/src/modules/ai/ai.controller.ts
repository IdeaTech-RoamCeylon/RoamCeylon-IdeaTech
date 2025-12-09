import { Controller, Get, Post, Logger } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiService: AIService) { }

  @Get('health')
  health() {
    this.logger.log('AI health check triggered');
    return this.aiService.health();
  }

  @Post('embeddings/seed')
  // @UseGuards(AuthGuard)  // enable if needed
  async seedEmbeddings() {
    this.logger.log('AI seed embeddings triggered');
    return this.aiService.seedEmbeddings();
  }
}
