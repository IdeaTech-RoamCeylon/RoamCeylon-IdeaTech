import { Controller, Get, Post } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('health')
  health() {
    return this.aiService.health();
  }

  @Post('embeddings/seed')
  // @UseGuards(AuthGuard)  // enable if needed
  async seedEmbeddings() {
    return this.aiService.seedEmbeddings();
  }
}
