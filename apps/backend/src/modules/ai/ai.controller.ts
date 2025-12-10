import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { EmbeddingService } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';

export interface SearchResponseDto {
  query: string;
  results: {
    rank: number;
    id: number | string;
    text: string;
    score: number;
    metadata?: any;
  }[];
}

// Type definition for items stored in the database
interface EmbeddingItem {
  id: string;
  title: string;
  content: string;
  embedding: number[];
}

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly searchService: SearchService,
  ) {}

  // ------------------- HEALTH CHECK -------------------
  @Get('health')
  getHealth(): { message: string } {
    this.logger.log('AI Planner health check triggered');
    return { message: 'AI Planner Module Operational' };
  }

  // ------------------- SEARCH -------------------
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    this.logger.log(`Received search query: "${query}"`);
    const lim = limit ? parseInt(limit, 10) : 10;

    const preprocessedQuery = preprocessQuery(query);
    this.logger.log(`Preprocessed query: "${preprocessedQuery}"`);

    const embedding = this.embeddingService.generateDummyEmbedding(
      preprocessedQuery,
      1536,
    );

    this.logger.log('Searching embeddings...');
    const results =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    this.logger.log(`Returning ${results.length} results`);
    return {
      query,
      results,
    };
  }

  // ------------------- DEBUG EMBEDDING -------------------
  @Get('debug/embedding')
  debugEmbedding(@Query('text') text: string) {
    this.logger.log(`Debug embedding requested for text: "${text}"`);
    const start = Date.now();

    const preprocessedText = preprocessQuery(text);
    this.logger.log(`Preprocessed debug text: "${preprocessedText}"`);
    const embedding = this.embeddingService.generateDummyEmbedding(
      preprocessedText,
      1536,
    );

    const end = Date.now();
    const timeMs = end - start;

    const notes: string[] = [];
    if (!text) {
      notes.push('Input text was empty.');
    }
    if (embedding.every((v) => v === 0)) {
      notes.push('Embedding is all zeros.');
    }
    if (embedding.length !== 1536) {
      notes.push(
        `Embedding dimension mismatch: got ${embedding.length}, expected 1536.`,
      );
    }

    const min = Math.min(...embedding);
    const max = Math.max(...embedding);

    return {
      cleanedQuery: preprocessedText,
      embedding,
      dimension: embedding.length,
      min,
      max,
      timeMs,
      notes,
    };
  }
}