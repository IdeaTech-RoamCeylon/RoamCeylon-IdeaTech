import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService, SearchResultDto } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';

export interface SearchResponseDto {
  query: string;
  results: {
    rank: number;
    id: number | string;
    title: string;
    content: string;
    score: number;
    metadata?: any;
  }[];
}

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
  }

  // ---------------- Cosine similarity search (in-memory) ----------------
  @Get('search')
  async search(@Query('query') query: string) {
    const startTotal = Date.now();
    this.logger.log(`🔍 Search query received: "${query}"`);

    if (!query) return { error: 'Query parameter "query" is required' };

    // Preprocess logging
    const cleanedQuery = preprocessQuery(query);
    this.logger.log(`🧹 Preprocessed query: "${cleanedQuery}"`);

    // Embedding timing
    const embedStart = Date.now();
    const queryVector = this.aiService.generateDummyEmbedding(cleanedQuery, 1536);
    const embedTime = Date.now() - embedStart;

    this.logger.log(`⚙️ Embedding generated in ${embedTime}ms`);

    // Search timing
    const searchStart = Date.now();
    const items = await this.aiService.getAllEmbeddings();

    const scored = items
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }))
      .filter((item) => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const searchTime = Date.now() - searchStart;

    this.logger.log(`⏱️ Search duration: ${searchTime}ms`);
    this.logger.log(`🏆 Ranked results: ${JSON.stringify(scored)}`);

    const total = Date.now() - startTotal;
    this.logger.log(`✅ Total search pipeline time: ${total}ms`);

    return {
      query,
      results: scored.map((r, idx) => ({ rank: idx + 1, ...r })),
    };
  }

  // ---------------- Vector DB search (Postgres + pgvector) ----------------
  @Get('search/vector')
  async searchVector(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    const startTotal = Date.now();
    const lim = limit ? parseInt(limit, 10) : 10;

    this.logger.log(`🔍 Vector search - query received: "${query}"`);

    const cleanedQuery = preprocessQuery(query);
    this.logger.log(`🧹 Preprocessed query: "${cleanedQuery}"`);

    const embedStart = Date.now();
    const embedding = this.aiService.generateDummyEmbedding(cleanedQuery, 1536);
    const embedTime = Date.now() - embedStart;

    this.logger.log(`⚙️ Embedding generated in ${embedTime}ms`);

    const searchStart = Date.now();
    const results: SearchResultDto[] =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );
    const searchTime = Date.now() - searchStart;

    this.logger.log(`📡 Vector DB search duration: ${searchTime}ms`);
    this.logger.log(`🏆 Ranked results: ${JSON.stringify(results)}`);

    const total = Date.now() - startTotal;
    this.logger.log(`✅ Total vector search pipeline time: ${total}ms`);

    return { query, results };
  }

  // ------------------- SEED DATABASE -------------------
  @Post('seed')
  async seedDatabase() {
    this.logger.log('AI Planner seed database triggered');
    try {
      await this.aiService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch (error) {
      return {
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ------------------- DEBUG EMBEDDING -------------------
  @Get('debug/embedding')
  debugEmbedding(@Query('text') text: string) {
    this.logger.log(`Debug embedding requested for text: "${text}"`);

    const preprocessedText = preprocessQuery(text);
    const embedding = this.aiService.generateDummyEmbedding(
      preprocessedText,
      1536,
    );

    const notes: string[] = [];
    if (!text) notes.push('Input text was empty.');
    if (embedding.every((v) => v === 0)) notes.push('Embedding is all zeros.');
    if (embedding.length !== 1536)
      notes.push(
        `Embedding dimension mismatch: got ${embedding.length}, expected 1536.`,
      );

    const min = Math.min(...embedding);
    const max = Math.max(...embedding);

    return {
      cleanedQuery: preprocessedText,
      embedding,
      dimension: embedding.length,
      min,
      max,
      notes,
    };
  }
}
