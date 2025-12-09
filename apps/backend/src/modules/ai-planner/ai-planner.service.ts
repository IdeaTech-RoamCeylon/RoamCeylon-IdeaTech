import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './services/embedding.service';

@Injectable()
export class AiPlannerService {
  constructor(private readonly embeddingService: EmbeddingService) {}

  async seedEmbeddingsFromAiPlanner(): Promise<void> {
    await this.embeddingService.seedEmbeddings();
  }

  async getAllEmbeddings() {
    return await this.embeddingService.getAllEmbeddings();
  }

  generateDummyEmbedding(text: string, dim = 1536): number[] {
    return this.embeddingService.generateDummyEmbedding(text, dim);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return this.embeddingService.cosineSimilarity(a, b);
  }
}
