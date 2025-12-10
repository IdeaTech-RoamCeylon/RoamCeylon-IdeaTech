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
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) {
      return new Array<number>(dim).fill(0);
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
