import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create a deterministic dummy embedding for testing (no external API).
   * Returns a number[] of length dim.
   */
  async generateDummyEmbedding(text: string, dim = 1536): Promise<number[]> {
    if (!text) {
      const emptyVec: number[] = [];
      for (let i = 0; i < dim; i++) {
        emptyVec.push(0);
      }
      return emptyVec;
    }

    const vec: number[] = [];
    for (let i = 0; i < dim; i++) {
      const code = text.charCodeAt(i % text.length);
      const value: number = Number(((code % 100) / 100).toFixed(6));
      vec.push(value);
    }
    return vec;
  }
}