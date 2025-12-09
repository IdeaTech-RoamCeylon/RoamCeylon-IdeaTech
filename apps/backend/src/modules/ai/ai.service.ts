import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import tourismData from './data/sample-tourism.json';

export interface EmbeddingRow {
  id: number;
  text: string;
  embedding: number[];
  createdAt?: string;
}

@Injectable()
export class AIService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AIService.name);
  private prisma: PrismaClient;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.logger.debug('AIService constructor called');
  }

  async onModuleInit() {
    await this.initializePrisma();
  }

  async onModuleDestroy() {
    await this.disconnectPrisma();
  }

  private async initializePrisma(): Promise<void> {
    try {
      const dbUrl =
        this.configService.get<string>('DATABASE_URL') ||
        process.env.DATABASE_URL;

      if (!dbUrl) {
        throw new Error('DATABASE_URL is not configured');
      }

      this.prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } },
      });

      await this.prisma.$connect();
      this.isConnected = true;
      this.logger.debug('✅ Prisma client connected');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Prisma:', error);
      throw error;
    }
  }

  private async disconnectPrisma(): Promise<void> {
    if (this.prisma && this.isConnected) {
      await this.prisma.$disconnect();
      this.isConnected = false;
    }
  }

  health() {
    return {
      status: 'AI module running',
      database: this.isConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seed embeddings from tourism data
   */
  async seedEmbeddingsFromTourismData(): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      this.logger.log('Starting seeding process...');

      // Clear old embeddings
      await this.prisma.$executeRaw`DELETE FROM embeddings`;

      const maybeSamples = (tourismData as { tourism_samples?: unknown })
        .tourism_samples;
      const datasetArr: unknown[] = Array.isArray(maybeSamples)
        ? (maybeSamples as unknown[])
        : [];

      this.logger.debug(`Found ${datasetArr.length} tourism samples`);

      if (datasetArr.length === 0) {
        this.logger.warn('No tourism samples found');
        return;
      }

      let successCount = 0;

      for (const rawItem of datasetArr) {
        try {
          if (typeof rawItem !== 'object' || rawItem === null) continue;

          const item = rawItem as Record<string, unknown>;
          const title = typeof item.title === 'string' ? item.title : '';
          const description =
            typeof item.description === 'string' ? item.description : '';

          if (!description) continue;

          const text = title ? `${title}: ${description}` : description;
          const embedding = this.generateDummyEmbedding(text, 1536);
          const vectorLiteral = `[${embedding.join(',')}]`;

          await this.prisma.$executeRawUnsafe(
            `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
            text,
            vectorLiteral,
          );

          successCount++;
        } catch (itemError) {
          this.logger.error('Error processing item:', itemError);
        }
      }

      this.logger.log(`Seeding completed: ${successCount} items added`);
    } catch (err) {
      this.logger.error('Seeding error:', err);
      throw err;
    }
  }

  /**
   * Search embeddings by similarity
   */
  async searchEmbeddings(query: string, limit = 10): Promise<EmbeddingRow[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      this.logger.debug(`Searching embeddings for: "${query}"`);

      const queryEmbedding = this.generateDummyEmbedding(query, 1536);
      const vectorLiteral = `[${queryEmbedding.join(',')}]`;

      // CAST embedding to TEXT to avoid deserialization error
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

      return rawRows
        .map((row) => this.parseDbRowFromSearch(row))
        .filter(Boolean) as EmbeddingRow[];
    } catch (err) {
      this.logger.error('Error searching embeddings:', err);
      throw err;
    }
  }

  /**
   * Retrieve all embeddings from DB
   */
  async getAllEmbeddings(): Promise<EmbeddingRow[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      this.logger.debug('Fetching all embeddings...');

      // CAST embedding to TEXT to avoid deserialization error
      const result = await this.prisma.$queryRawUnsafe(
        'SELECT id, text, embedding::text as embedding_str, created_at FROM embeddings',
      );

      const rawRows: unknown[] = Array.isArray(result)
        ? (result as unknown[])
        : [];

      return rawRows
        .map((row) => this.parseDbRowFromSearch(row))
        .filter(Boolean) as EmbeddingRow[];
    } catch (err) {
      this.logger.error('Error fetching embeddings:', err);
      throw err;
    }
  }

  /**
   * Parse database row from search results
   */
  private parseDbRowFromSearch(raw: unknown): EmbeddingRow | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;

    const id = typeof r.id === 'number' ? r.id : undefined;
    const text = typeof r.text === 'string' ? r.text : '';
    const createdAt =
      typeof r.created_at === 'string' ? r.created_at : undefined;

    // Parse embedding from the CAST string
    const embeddingStr =
      typeof r.embedding_str === 'string' ? r.embedding_str : '';
    const embedding = this.parseVectorString(embeddingStr);

    if (id === undefined) {
      return null;
    }

    return {
      id,
      text,
      embedding,
      createdAt,
    };
  }

  /**
   * Parse PostgreSQL vector string
   */
  private parseVectorString(vectorStr: string): number[] {
    if (!vectorStr) return [];

    try {
      const clean = vectorStr.trim();
      if (clean.startsWith('[') && clean.endsWith(']')) {
        const inner = clean.slice(1, -1);
        const parsed: number[] = inner.split(',').map((p) => {
          const num = Number(p.trim());
          return Number.isNaN(num) ? 0 : num;
        });
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Create a deterministic dummy embedding
   */
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) {
      return new Array<number>(dim).fill(0);
    }

    const vec: number[] = [];
    for (let i = 0; i < dim; i++) {
      const code = text.charCodeAt(i % text.length);
      const value = Number(((code % 100) / 100).toFixed(6));
      vec.push(value);
    }
    return vec;
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Get database connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      timestamp: new Date().toISOString(),
    };
  }
}
