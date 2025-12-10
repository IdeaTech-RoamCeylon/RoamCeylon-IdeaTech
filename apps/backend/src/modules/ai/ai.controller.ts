import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { AIService } from './ai.service';

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

  constructor(private readonly aiService: AIService) {}

  // ------------------- HEALTH CHECK -------------------
  @Get('health')
  getHealth(): { message: string } {
    this.logger.log('AI Planner health check triggered');
    return { message: 'AI Planner Module Operational' };
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

  // ------------------- SEARCH -------------------
  @Get('search')
  async search(@Query('query') query: string) {
    if (!query) {
      return { error: 'Query parameter "query" is required' };
    }

    const cleanedQuery = query
      .toLowerCase() // lowercase
      .replace(/[^\w\s]/g, '') // remove punctuation
      .trim() // trim spaces
      .split(/\s+/) // tokenize by spaces
      .join(' '); // rejoin clean tokens

    // Generate embedding for cleaned query
    const queryVector: number[] = this.aiService.generateDummyEmbedding(
      cleanedQuery,
      1536,
    );

    // Fetch all embeddings with proper type
    const items: EmbeddingItem[] = await this.aiService.getAllEmbeddings();

    // Score items using cosine similarity
    const scored = items.map((item: EmbeddingItem) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      score: this.aiService.cosineSimilarity(queryVector, item.embedding),
    }));

    // Return top 5 results
    return {
      query,
      results: scored.sort((a, b) => b.score - a.score).slice(0, 5),
    };
  }

  // ------------------- SEARCH IN MEMORY -------------------
  @Get('search/memory')
  async searchEmbeddingsInMemory(@Query('query') query?: string): Promise<
    | { error: string }
    | {
        query: string;
        results: Array<{
          id: string;
          title: string;
          content: string;
          score: number;
        }>;
      }
  > {
    if (!query) {
      return { error: 'Query parameter "query" is required' };
    }

    try {
      const queryVector = this.aiService.generateDummyEmbedding(query, 1536);
      const embeddings = await this.aiService.getAllEmbeddings();

      const scored = embeddings.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }));

      return {
        query,
        results: scored.sort((a, b) => b.score - a.score).slice(0, 5),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  // ------------------- GET ALL EMBEDDINGS -------------------
  @Get('embeddings')
  async getAllEmbeddings() {
    try {
      return await this.aiService.getAllEmbeddings();
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to fetch embeddings',
      };
    }
  }

  // ------------------- GENERATE EMBEDDING -------------------
  @Post('embedding')
  generateEmbedding(@Body() body: { text: string }) {
    if (!body.text) {
      return { error: 'Text is required' };
    }

    const embedding = this.aiService.generateDummyEmbedding(body.text, 1536);

    return {
      text: body.text,
      embeddingPreview: embedding.slice(0, 10),
      dimensions: embedding.length,
    };
  }

  // ------------------- SIMILARITY BETWEEN TEXTS -------------------
  @Post('similarity')
  calculateSimilarity(@Body() body: { text1: string; text2: string }) {
    if (!body.text1 || !body.text2) {
      return { error: 'Both text1 and text2 are required' };
    }

    const embedding1 = this.aiService.generateDummyEmbedding(body.text1, 1536);
    const embedding2 = this.aiService.generateDummyEmbedding(body.text2, 1536);

    const similarity = this.aiService.cosineSimilarity(embedding1, embedding2);

    return {
      text1: body.text1,
      text2: body.text2,
      similarity: similarity.toFixed(4),
    };
  }
}
