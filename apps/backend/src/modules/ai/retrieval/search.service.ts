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
  metadata?: {
    createdAt: string | null;
  };
}

export interface RawEmbeddingRow {
  id: number | string;
  title: string;
  content: string;
  embedding_str: string;
  created_at: string | null;
  distance: number;
}

export interface RawEmbeddingRow {
  id: number | string;
  title: string;
  content: string;
  embedding_str: string;
  created_at: string | null;
  distance: number;
}

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private logger = new Logger(SearchService.name);
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  private createClient(): Client {
    // Check if we have individual vars, otherwise use DATABASE_URL
    const dbUrl = this.configService.get<string>('DATABASE_URL');

    // If DATABASE_URL is present, use it for connection string
    if (dbUrl) {
      return new Client({
        connectionString: dbUrl,
        // Nhost requires SSL, usually inferred from url ?sslmode=require but explicit is safer
        ssl: dbUrl.includes('sslmode=')
          ? { rejectUnauthorized: false }
          : undefined,
      });
    }

    // Fallback to individual vars (which appear to be missing in your .env)
    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: this.configService.get<string>('DB_PASSWORD') ?? '',
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
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const vectorLiteral = `[${embedding.join(',')}]`;

    const result = await this.client.query<RawEmbeddingRow>(
      `SELECT 
          id,
          title,
          content,
          embedding::text AS embedding_str,
          embedding <=> $1::vector AS distance
       FROM embeddings
       ORDER BY distance
       LIMIT $2`,
      [vectorLiteral, limit],
    );

    return result.rows.map((row, index) => {
      const score = this.normalizeScore(row.distance);

      return {
        rank: index + 1,
        id: row.id,
        title: row.title,
        content: row.content,
        score,
        metadata: {
          createdAt: row.created_at,
        },
      };
    });
  }
}
