import { Controller, Get, Query } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

@Controller('ai')
export class AIController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Get('search')
  async search(@Query('query') query: string) {
    return this.embeddingService.search(query);
  }
}
