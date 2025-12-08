import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class AIService {
  constructor(private readonly embeddingService: EmbeddingService) {}

  health() {
    return 'AI module running';
  }

  search(query: string) {
    return this.embeddingService.search(query);
  }
}
