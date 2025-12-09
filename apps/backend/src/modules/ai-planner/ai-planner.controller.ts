import { Controller, Get, Post, Query } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';

// Type definition for items stored in the database
interface EmbeddingItem {
  id: string;
  title: string;
  content: string;
  embedding: number[];
}

@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  // ------------------- HEALTH CHECK -------------------
  @Get('health')
  getHealth(): { message: string } {
    return { message: 'AI Planner Module Operational' };
  }

  // ------------------- SEED DATABASE -------------------
  @Post('seed')
  async seedDatabase(): Promise<{ message: string; error?: string }> {
    try {
      await this.aiPlannerService.seedEmbeddingsFromAiPlanner();
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

    // Explicitly typed query vector
    const queryVector: number[] = this.aiPlannerService.generateDummyEmbedding(
      query,
      1536,
    );

    // Fetch all embeddings with proper type
    const items: EmbeddingItem[] =
      await this.aiPlannerService.getAllEmbeddings();

    // Score items using cosine similarity
    const scored = items.map((item: EmbeddingItem) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      score: this.aiPlannerService.cosineSimilarity(
        queryVector,
        item.embedding,
      ),
    }));

    // Return top 5 results
    return {
      query,
      results: scored.sort((a, b) => b.score - a.score).slice(0, 5),
    };
  }
}
