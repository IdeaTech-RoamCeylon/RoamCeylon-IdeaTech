import { Injectable } from '@nestjs/common';
import { EmbeddingDto } from '../dto/embedding.dto';

@Injectable()
export class EmbeddingService {
  async generate(dto: EmbeddingDto) {
    
    return {
      message: 'Embedding placeholder generated',
      payload: dto,
      vector: null,
    };
  }
}
