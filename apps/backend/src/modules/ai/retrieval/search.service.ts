import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

export interface SearchResultDto {
  rank: number;
  id: number | string;
  title: string;
  content: string;
  score: number;
  metadata?: any;
}

export interface RawEmbeddingRow {
  id: number | string;
  title: string;
  content: string;
  embedding_str: string;
  created_at: string;
  distance: number;
}

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private logger = new Logger(SearchService.name);
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  // ------------------ POSTGRES CLIENT ------------------
  private createClient(): Client {
    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: String(this.configService.get<string>('DB_PASSWORD') || ''),
      port: Number(this.configService.get<string>('DB_PORT')),
    });
  }

  async onModuleInit() {
    this.client = this.createClient();
    await this.client.connect();
    this.isConnected = true;
    this.logger.log('Postgres client connected in SearchService');
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
      this.logger.log('Postgres client disconnected in SearchService');
    }
  }

  private normalizeScore(distance: number): number {
    return 1 - Math.min(Math.max(distance, 0), 1);
  }

  async searchEmbeddingsWithMetadataFromEmbedding(
    embedding: number[],
    limit = 10,
  ): Promise<SearchResultDto[]> {
    if (!this.isConnected) throw new Error('Database not connected');

    const vectorLiteral = `[${embedding.join(',')}]`;

    const result = await this.client.query<RawEmbeddingRow>(
      `SELECT id, title, content,
            embedding::text as embedding_str,
            created_at,
            embedding <=> $1::vector as distance
     FROM embeddings
     ORDER BY distance
     LIMIT $2`,
      [vectorLiteral, limit],
    );

    return result.rows.map((r, idx) => ({
      rank: idx + 1,
      id: r.id,
      title: r.title,
      content: r.content,
      score: this.normalizeScore(Number(r.distance)),
      metadata: { createdAt: r.created_at },
    }));
  }
}
