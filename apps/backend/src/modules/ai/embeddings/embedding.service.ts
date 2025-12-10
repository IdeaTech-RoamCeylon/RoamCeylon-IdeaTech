// src/modules/ai-planner/services/embedding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import tourismData from '../data/sample-tourism.json';

/**
 * Strongly-typed shape for an embedding row returned to callers
 */
export interface EmbeddingRow {
  id: string;
  title: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly configService: ConfigService) {}

  private createClient(): Client {
    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: String(this.configService.get<string>('DB_PASSWORD') || ''),
      port: Number(this.configService.get<string>('DB_PORT') || 5432),
    });
  }

  // ------------------ SEEDING ------------------
  async seedEmbeddings(): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      const res = await client.query('SELECT NOW()');
      this.logger.debug(
        `PostgreSQL current time: ${JSON.stringify(res.rows?.[0])}`,
      );

      // Optional: clear old embeddings
      await client.query('DELETE FROM embeddings');

      // Narrow tourismData safely to unknown[] before iterating (avoid any)
      const maybeSamples = (tourismData as { tourism_samples?: unknown })
        .tourism_samples;
      const datasetArr: unknown[] = Array.isArray(maybeSamples)
        ? (maybeSamples as unknown[])
        : [];

      if (datasetArr.length === 0) {
        this.logger.warn('No tourism samples found to seed.');
        return;
      }

      for (const rawItem of datasetArr) {
        if (typeof rawItem !== 'object' || rawItem === null) continue;
        const item = rawItem as Record<string, unknown>;
        const title = typeof item.title === 'string' ? item.title : '';
        const description =
          typeof item.description === 'string' ? item.description : '';
        if (!description) continue;

        // Generate 1536-dim embedding
        const embedding = this.generateDummyEmbedding(description, 1536);

        // Convert JS array to PostgreSQL vector literal (pgvector expects format: '[0.1,0.2,...]')
        const vectorLiteral = `[${embedding.join(',')}]`;

        await client.query(
          `INSERT INTO embeddings (title, content, embedding)
           VALUES ($1, $2, $3::vector)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
          [title, description, vectorLiteral],
        );
      }

      this.logger.log('Seeding completed!');
    } catch (err) {
      this.logger.error('Seeding error:', err as Error);
      throw err;
    } finally {
      await client.end();
    }
  }

  // ------------------ FETCH ALL ------------------
  /**
   * Retrieve all embeddings from DB and return typed rows.
   */
  async getAllEmbeddings(): Promise<EmbeddingRow[]> {
    const client = this.createClient();

    try {
      await client.connect();
      const result = await client.query(
        'SELECT id, title, content, embedding, metadata, created_at FROM embeddings',
      );

      // Narrow result.rows to unknown[] to avoid any
      const rawRows: unknown[] = Array.isArray(result.rows)
        ? (result.rows as unknown[])
        : [];

      // Build parsedRows with an explicit loop (avoids any[] inference)
      const parsedRows: EmbeddingRow[] = [];
      for (const r of rawRows) {
        const parsed = this.parseDbRow(r);
        if (parsed) parsedRows.push(parsed);
      }

      if (parsedRows.length !== rawRows.length) {
        this.logger.warn(
          `getAllEmbeddings: ${rawRows.length - parsedRows.length} invalid row(s) were skipped.`,
        );
      }

      return parsedRows;
    } finally {
      await client.end();
    }
  }

  // ------------------ UTILS & PARSING ------------------

  /** Type guard for number[] */
  private isNumberArray(x: unknown): x is number[] {
    return Array.isArray(x) && x.every((v) => typeof v === 'number');
  }

  /** Helper to ensure a value is a number array with proper typing */
  private ensureNumberArray(value: unknown): number[] | null {
    if (!Array.isArray(value)) return null;

    const result: number[] = [];
    for (const item of value) {
      if (typeof item === 'number' && !Number.isNaN(item)) {
        result.push(item);
      } else {
        return null;
      }
    }
    return result;
  }

  /**
   * Parse a DB row (unknown) into EmbeddingRow or null if invalid.
   * Handles embedding stored as JSON string or native array.
   */
  private parseDbRow(raw: unknown): EmbeddingRow | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;

    const id = typeof r.id === 'string' ? r.id : undefined;
    const title = typeof r.title === 'string' ? r.title : '';
    const content = typeof r.content === 'string' ? r.content : '';
    const createdAt =
      typeof r.created_at === 'string' ? r.created_at : undefined;

    // metadata may be json/record or null
    const metadata =
      typeof r.metadata === 'object' && r.metadata !== null
        ? (r.metadata as Record<string, unknown>)
        : undefined;

    // embedding: could be array of numbers, or a string like "[0.1,0.2,...]"
    let embedding: number[] | undefined;

    if (this.isNumberArray(r.embedding)) {
      // Use the ensureNumberArray helper for type safety
      const ensuredArray = this.ensureNumberArray(r.embedding);
      embedding = ensuredArray || [];
    } else if (typeof r.embedding === 'string') {
      // try to parse "[0.1,0.2]" or maybe postgres format without quotes
      try {
        const parsed: unknown = JSON.parse(r.embedding);
        const ensuredArray = this.ensureNumberArray(parsed);
        if (ensuredArray) {
          embedding = ensuredArray;
        }
      } catch {
        // fallback: try to parse by removing brackets and splitting
        const s = r.embedding.trim();
        const noBrackets = s.replace(/^\[|\]$/g, '');
        if (noBrackets.length > 0) {
          const parts: number[] = [];
          const rawParts = noBrackets.split(',');

          for (const part of rawParts) {
            const num = Number(part.trim());
            if (!Number.isNaN(num)) {
              parts.push(num);
            }
          }

          if (parts.length > 0) {
            embedding = parts;
          }
        } else {
          embedding = [];
        }
      }
    }

    if (!id || !embedding) return null;

    return {
      id,
      title,
      content,
      embedding,
      metadata,
      createdAt,
    };
  }

  /**
   * Create a deterministic dummy embedding for testing (no external API).
   * Returns a number[] of length dim.
   */
  /**
   * Create a deterministic dummy embedding for testing (no external API).
   * Returns a number[] of length dim.
   */
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) {
      // Explicitly type the array as number[] and fill with typed values
      const emptyVec: number[] = [];
      for (let i = 0; i < dim; i++) {
        emptyVec.push(0);
      }
      return emptyVec;
    }

    // Explicitly type vec as number[]
    const vec: number[] = [];
    for (let i = 0; i < dim; i++) {
      const code = text.charCodeAt(i % text.length);
      const value: number = Number(((code % 100) / 100).toFixed(6));
      vec.push(value);
    }
    return vec;
  }
  /**
   * Cosine similarity between two numeric vectors (explicit types)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (
      !this.isNumberArray(a) ||
      !this.isNumberArray(b) ||
      a.length !== b.length
    )
      return 0;

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
}
