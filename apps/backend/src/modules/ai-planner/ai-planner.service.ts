import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './services/embedding.service';

@Injectable()
export class AiPlannerService {
  constructor(private readonly embeddingService: EmbeddingService) {}

  async seedEmbeddingsFromAiPlanner(): Promise<void> {
    await this.embeddingService.seedEmbeddings();
  }
}
