import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class AIService {
  private prisma = new PrismaClient();

  constructor(private readonly embeddingService: EmbeddingService) {}

  health() {
    return 'AI module running';
  }

  async seedEmbeddings() {
    const descriptions = [
      'Beautiful sandy beaches with crystal clear water.',
      'Ancient ruins from the 12th century.',
      'Lush green tea plantations in the hill country.',
      'Wildlife safari with elephants and leopards.',
      'Bustling city life with vibrant markets.',
      'Serene temples and religious sites.',
      'Scenic train rides through the mountains.',
      'Delicious local cuisine and street food.',
      'Surfing spots with great waves.',
      'Relaxing ayurvedic spas and wellness centers.',
    ];

    for (const text of descriptions) {
      const vector = Array.from({ length: 1536 }, () => Math.random());
      const vectorString = `[${vector.join(',')}]`;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
        text,
        vectorString,
      );
    }

    return { success: true, message: 'Embeddings seeded' };
  }

  search(query: string) {
    return this.embeddingService.search(query);
  }
}
