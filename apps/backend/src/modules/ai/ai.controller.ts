import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
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
  message?: string;
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
    // Empty or missing
    if (!query || query.trim() === '') {
      return { error: 'Query cannot be empty' };
    }

    // Too short
    if (query.length < 3) {
      return { error: 'Query too short (minimum 3 characters)' };
    }

    // Invalid characters (basic safety filter — FIXED)
    const safePattern = /^[a-zA-Z0-9]+$/;
    if (!safePattern.test(query)) {
      return { error: 'Query contains invalid characters' };
    }

    // Too long
    if (query.length > 15) {
      return { error: 'Query too long (maximum 300 characters)' };
    }

    const cleanedQuery = preprocessQuery(query);
    const queryVector = this.aiService.generateDummyEmbedding(
      cleanedQuery,
      1536,
    );

    const items = await this.aiService.getAllEmbeddings();

    const scored = items
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }))
      .filter((item) => item.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

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
    const lim = limit ? parseInt(limit, 10) : 10;
    const cleanedQuery = preprocessQuery(query);
    const embedding = this.aiService.generateDummyEmbedding(cleanedQuery, 1536);

    const rawResults =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    if (Array.isArray(rawResults)) {
      return { query, results: rawResults };
    } else {
      // No results found, return empty array and include the message
      return { query, results: [], message: rawResults.message };
    }
  }

  // ------------------- SEED DATABASE -------------------
  @Post('seed')
  async seedDatabase(): Promise<{ message: string }> {
    this.logger.log('AI Planner seed database triggered');
    try {
      await this.aiService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch {
      return { message: 'Seeding failed.' };
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
