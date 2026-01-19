import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embeddings/embedding.service';

export interface SearchResultDto {
  rank: number;
  text: string;
  score: number;
  source: string | number;
  createdAt?: string;
}

@Injectable()
export class AIService {
  constructor(private readonly embeddingService: EmbeddingService) {}

  async seedEmbeddingsFromAiPlanner(): Promise<void> {
    await this.embeddingService.seedEmbeddings();
  }

  async getAllEmbeddings() {
    return await this.embeddingService.getAllEmbeddings();
  }

  async search(vector: number[], limit: number) {
    return await this.embeddingService.searchEmbeddings(vector, limit);
  }

  generateDummyEmbedding(text: string, dim = 1536): number[] {
    return this.embeddingService.generateDummyEmbedding(text, dim);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return this.embeddingService.cosineSimilarity(a, b);
  }

  isPartialMatch(token: string, text: string): boolean {
    return this.embeddingService.isPartialMatch(token, text);
  }
}
