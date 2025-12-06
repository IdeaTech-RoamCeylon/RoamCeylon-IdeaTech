import { Injectable } from '@nestjs/common';
import { EmbeddingDto } from '../dto/embedding.dto';

@Injectable()
export class EmbeddingService {
  generate(dto: EmbeddingDto) {
    return {
      message: 'Embedding placeholder generated',
      payload: dto,
      vector: null,
    };
  }
}
