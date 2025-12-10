import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export interface EmbeddingRow {
  id: number;
  text: string;
  embedding: number[];
  createdAt?: string;
}

export interface SearchResultDto {
  rank: number;
  text: string;
  score: number;
  id: number | string;
  metadata?: any;
}

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private logger = new Logger(SearchService.name);
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.prisma = new PrismaClient();
    await this.prisma.$connect();
    this.isConnected = true;
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.isConnected = false;
    this.logger.log('Prisma disconnected');
  }

  private normalizeScore(distance: number): number {
    return 1 - Math.min(Math.max(distance, 0), 1);
  }

  private parseDbRowFromSearch(row: unknown): EmbeddingRow | null {
    if (!row || typeof row !== 'object') return null;
    const r = row as Record<string, unknown>;
    return {
      id: typeof r.id === 'number' ? r.id : 0,
      text: typeof r.text === 'string' ? r.text : '',
      embedding: [],
      createdAt: typeof r.created_at === 'string' ? r.created_at : undefined,
    };
  }

  async searchEmbeddingsWithMetadataFromEmbedding(
    embedding: number[],
    limit = 10,
  ): Promise<SearchResultDto[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    this.logger.debug('Searching embeddings with provided embedding...');
    const vectorLiteral = `[${embedding.join(',')}]`;

    const result = await this.prisma.$queryRawUnsafe(
      `SELECT id, text, 
              embedding::text as embedding_str,
              created_at,
              embedding <=> $1::vector as distance
       FROM embeddings
       ORDER BY distance
       LIMIT $2`,
      vectorLiteral,
      limit,
    );

    const rawRows: unknown[] = Array.isArray(result)
      ? (result as unknown[])
      : [];

    const resultsWithScore = rawRows
      .map((row) => {
        const parsed = this.parseDbRowFromSearch(row);
        if (!parsed) return null;
        const r = row as Record<string, unknown>;
        const distance = typeof r.distance === 'number' ? r.distance : 0;
        const score = this.normalizeScore(distance);
        return {
          text: parsed.text,
          score,
          id: parsed.id,
          metadata: parsed.createdAt
            ? { createdAt: parsed.createdAt }
            : undefined,
        };
      })
      .filter(Boolean) as Omit<SearchResultDto, 'rank'>[];

    const sortedResults = resultsWithScore
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
      }));

    return sortedResults;
  }
}
