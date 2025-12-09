import { Controller, Get, Query, Logger } from '@nestjs/common';
import { AIService, SearchResultDto } from './ai.service';
import { EmbeddingService } from './embeddings/embedding.service';

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResultDto[]> {
    this.logger.log(`Received search query: "${query}"`);
    const lim = limit ? parseInt(limit, 10) : 10;

    // Step 1: Generate embedding from text
    this.logger.log('Generating embedding for query...');
    const embedding = this.embeddingService.generateDummyEmbedding(query, 1536);

    // Step 2: Search using embedding
    this.logger.log('Searching embeddings...');
    const results =
      await this.aiService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    this.logger.log(`Returning ${results.length} results`);
    return results;
  }
}
