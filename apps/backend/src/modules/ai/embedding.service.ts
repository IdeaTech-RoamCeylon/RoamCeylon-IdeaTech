import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EmbeddingService {
  private prisma = new PrismaClient();

  async search(query: string) {
    const queryVector = Array.from({ length: 1536 }, () => Math.random());
    const vectorString = `[${queryVector.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe(`
      SELECT 
        text, 
        embedding <=> '${vectorString}'::vector AS score
      FROM embeddings
      ORDER BY score
      LIMIT 5;
    `);

    return results;
  }
}
