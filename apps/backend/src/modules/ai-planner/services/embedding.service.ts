import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmbeddingService {
  constructor(private prisma: PrismaService) {}

  
 createEmbedding(text: string): Promise<number[]> {
 
  return Promise.resolve([]);
}

async storeEmbedding(text: string, vector: number[]) {
  
  return;
}
}
