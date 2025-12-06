import { Injectable } from '@nestjs/common';
import { EmbeddingDto } from '../dto/embedding.dto';
import { createEmbedding } from '../utils/embedding';

@Injectable()
export class EmbeddingService {
  async generate(dto: EmbeddingDto) {
    // Placeholder logic
    const vector = await createEmbedding(dto.text);

    return {
      message: 'Embedding placeholder generated',
      payload: dto,
      vector,
    };
  }
}
