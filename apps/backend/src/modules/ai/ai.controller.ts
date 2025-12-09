import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AIService, EmbeddingRow } from './ai.service';

/** Updated interface to match the actual data structure */
interface SearchResultItem {
  id: number; // Changed from string to number
  text: string; // Changed from content to text
  title?: string; // Optional if you want to keep title
  score: number;
}

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('health')
  health() {
    return this.aiService.health();
  }

  /**
   * Seed database with tourism data
   */
  @Post('embeddings/seed')
  async seedEmbeddings(): Promise<{ message: string; error?: string }> {
    try {
      await this.aiService.seedEmbeddingsFromTourismData();
      return { message: 'Seeding completed successfully!' };
    } catch (error) {
      return {
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search embeddings with similarity scoring
   */
  @Get('search')
  async searchEmbeddings(
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ): Promise<
    | { error?: string }
    | {
        query: string;
        results: SearchResultItem[];
      }
  > {
    if (!query) {
      return { error: 'Query parameter "query" is required' };
    }

    const limitNum = limit ? parseInt(limit, 10) : 5;

    try {
      // Use the new searchEmbeddings method from the service
      const searchResults = await this.aiService.searchEmbeddings(
        query,
        limitNum,
      );

      const results: SearchResultItem[] = searchResults.map((item) => {
        const itemWithDistance = item as EmbeddingRow & { distance?: number };
        return {
          id: item.id,
          text: item.text,
          // If you have title in the text, you could extract it
          // For example, if text format is "Title: Description"
          title: item.text.split(':')[0] || '', // Optional extraction
          score: 1.0 - (itemWithDistance.distance ?? 0), // Convert distance to similarity score
        };
      });

      return {
        query,
        results,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Alternative search using cosine similarity in memory
   */
  @Get('search/memory')
  async searchEmbeddingsInMemory(@Query('query') query?: string): Promise<
    | { error?: string }
    | {
        query: string;
        results: SearchResultItem[];
      }
  > {
    if (!query) {
      return { error: 'Query parameter "query" is required' };
    }

    try {
      const queryVector: number[] = this.aiService.generateDummyEmbedding(
        query,
        1536,
      );

      const embeddings: EmbeddingRow[] =
        await this.aiService.getAllEmbeddings();

      const scored = embeddings.map((item) => ({
        id: item.id,
        text: item.text,
        title: item.text.split(':')[0] || '', // Extract title from text if needed
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }));

      const results = scored.sort((a, b) => b.score - a.score).slice(0, 5);

      return {
        query,
        results,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get all embeddings
   */
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

  /**
   * Get database connection status
   */
  @Get('status')
  getConnectionStatus() {
    return this.aiService.getConnectionStatus();
  }

  /**
   * Test endpoint to generate embedding for a text
   */
  @Post('embedding')
  generateEmbedding(@Body() body: { text: string }) {
    if (!body.text) {
      return { error: 'Text is required' };
    }

    const embedding = this.aiService.generateDummyEmbedding(body.text, 1536);
    return {
      text: body.text,
      embedding: embedding.slice(0, 10), // Return first 10 dimensions for preview
      dimensions: embedding.length,
    };
  }

  /**
   * Calculate similarity between two texts
   */
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
