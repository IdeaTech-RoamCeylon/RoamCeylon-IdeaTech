import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmbeddingService {
  constructor(private prisma: PrismaService) {}

  createEmbedding(_text: string): Promise<number[]> {
    const mockVector = Array.from({ length: 1536 }, () => Math.random());
    return Promise.resolve(mockVector);
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
