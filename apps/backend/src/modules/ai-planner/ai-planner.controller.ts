import { Controller, Get, Post, Query } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';

@Controller('ai')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Get('health')
  getHealth() {
    return 'AI Planner Module Operational';
  }

  @Post('seed')
  async seedDatabase() {
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

    // Convert query to vector
    const queryVector = this.aiPlannerService.generateDummyEmbedding(
      query,
      1536,
    );

    // Fetch DB items
    const items = await this.aiPlannerService.getAllEmbeddings();

    // Score with cosine similarity
    const scored = items.map((item) => ({
      id: item.item_id,
      title: item.title,
      content: item.content,
      score: this.aiPlannerService.cosineSimilarity(
        queryVector,
        item.embedding,
      ),
    }));

    // Return top 5
    return {
      query,
      results: scored.sort((a, b) => b.score - a.score).slice(0, 5),
    };
  }
}
