import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmbeddingService {
  constructor(private prisma: PrismaService) {}

  
 createEmbedding(text: string): Promise<number[]> {
 
  const vector = [text.length, text.length % 10, text.length % 5];
  return Promise.resolve(vector);
}

async storeEmbedding(text: string, vector: number[]) {
  
  return await this.prisma.embeddings.create({
    data: {
      text,
      embedding: JSON.stringify(vector),
    },
  });
}
}
