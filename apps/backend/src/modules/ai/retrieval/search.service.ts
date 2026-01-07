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
  confidence?: 'High' | 'Medium' | 'Low'; // NEW: confidence field
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
        // Nhost requires SSL with proper configuration
        ssl: dbUrl.includes('sslmode=')
          ? { rejectUnauthorized: false }
          : undefined,
        // Add keepalive settings to prevent connection drops
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        connectionTimeoutMillis: 10000,
        query_timeout: 30000,
      });
    }

    // Fallback to individual vars (which appear to be missing in your .env)
    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: this.configService.get<string>('DB_PASSWORD') ?? '',
      port: Number(this.configService.get<string>('DB_PORT')),
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
  }

  async onModuleInit() {
    this.client = this.createClient();

    // Add error handler to prevent crash
    this.client.on('error', (err) => {
      this.logger.error(`Database connection error: ${err.message}`);
      this.isConnected = false;
      // Attempt to reconnect after a delay
      setTimeout(() => {
        void this.reconnect();
      }, 5000);
    });

    try {
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Postgres client connected in SearchService');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to connect to database: ${error.message}`);
      this.isConnected = false;
    }
  }

  private async reconnect() {
    if (this.isConnected) return;

    try {
      this.logger.log('Attempting to reconnect to database...');
      this.client = this.createClient();
      this.client.on('error', (err) => {
        this.logger.error(`Database connection error: ${err.message}`);
        this.isConnected = false;
      });
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully reconnected to database');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Reconnection failed: ${error.message}`);
      // Try again after delay
      setTimeout(() => {
        void this.reconnect();
      }, 10000);
    }
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

  public getConfidence(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  }

  /**
   * Get confidence threshold value
   */
  public getConfidenceThreshold(level: 'High' | 'Medium' | 'Low'): number {
    const thresholds = {
      High: 0.8,
      Medium: 0.5,
      Low: 0.3,
    };
    return thresholds[level];
  }

  /**
   * Check if results meet quality standards
   * Made more flexible to accept partial result objects
   */
  public assessResultQuality(
    results: Array<{
      score: number;
      confidence?: 'High' | 'Medium' | 'Low';
    }>,
  ): {
    quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    message?: string;
  } {
    if (results.length === 0) {
      return {
        quality: 'Poor',
        message: 'No results found',
      };
    }

    const avgScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const highConfidenceCount = results.filter(
      (r) => r.confidence === 'High',
    ).length;
    const highConfidenceRatio = highConfidenceCount / results.length;

    if (avgScore >= 0.8 && highConfidenceRatio >= 0.7) {
      return { quality: 'Excellent' };
    }

    if (avgScore >= 0.65 && highConfidenceRatio >= 0.4) {
      return { quality: 'Good' };
    }

    if (avgScore >= 0.5) {
      return {
        quality: 'Fair',
        message: 'Results have moderate confidence. Consider refining your search.',
      };
    }

    return {
      quality: 'Poor',
      message:
        'Results have low confidence scores. Try different or more specific keywords.',
    };
  }

  public async searchEmbeddingsWithMetadataFromEmbedding(
    embedding: number[],
    limit = 10,
    similarityThreshold = 0.5,
    minConfidence?: 'High' | 'Medium' | 'Low',
  ): Promise<SearchResultDto[] | { message: string }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const vectorLiteral = `[${embedding.join(',')}]`;
    
    this.logger.log(`📡 Running pgvector search with limit=${limit}`);
    
    const start = Date.now();

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

    const dbTime = Date.now() - start;
    this.logger.log(`🗄️ Postgres search took ${dbTime}ms`);

    const normalized = result.rows.map((row) => {
      const score = this.normalizeScore(row.distance);

      return {
        id: row.id,
        title: row.title,
        content: row.content,
        score,
        metadata: {
          createdAt: row.created_at,
        },
      };
    });

    // Remove duplicates
    const unique = normalized.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id),
    );

    // Apply similarity threshold
    const strongMatches = unique.filter((item) => item.score >= similarityThreshold);

    // Initial ranking + attach confidence
    let ranked = strongMatches
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        confidence: this.getConfidence(item.score),
      }));

    // If minConfidence was provided, filter by its numeric threshold
    if (minConfidence) {
      const confThreshold = this.getConfidenceThreshold(minConfidence);
      ranked = ranked
        .filter((r) => r.score >= confThreshold)
        .sort((a, b) => b.score - a.score)
        .map((item, idx) => ({
          ...item,
        rank: idx + 1, // recompute ranks after filtering
      }));
    }

    this.logger.log(
    `📊 Final ranked vector results: ${JSON.stringify(
      ranked.map((r) => ({
        id: r.id,
        score: Number(r.score.toFixed(4)),
        confidence: r.confidence,
      })),
    )}`,
  );

    if (ranked.length === 0) {
      return {
        message: 'No relevant items found. Please try a different query.',
      };
    }

    return ranked;
  }
}