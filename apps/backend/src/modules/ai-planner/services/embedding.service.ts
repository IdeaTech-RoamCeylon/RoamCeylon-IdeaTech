import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmbeddingService {
  constructor(private prisma: PrismaService) {}

  async createEmbedding(text: string): Promise<number[]> {
    const mockVector = Array.from({ length: 1536 }, () => Math.random());
    return mockVector;
  }

  async storeEmbedding(text: string, vector: number[]) {
    return await this.prisma.embeddings.create({
      data: {
        text,
        embedding: `[${vector.join(',')}]`,
      },
    });
  }
}
