import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import rawTourismData from '../data/sample-tourism.json';

interface EmbeddingRow {
  id: string;
  title: string;
  content: string;
  embedding: unknown;
}

export interface EmbeddingItem {
  id: string;
  title: string;
  content: string;
  embedding: number[];
}

type TourismSample = {
  title: string;
  description: string;
  near?: string[];
  region?: string;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function parseTourismSamples(input: unknown): TourismSample[] {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid tourism dataset: not an object');
  }

  const obj = input as Record<string, unknown>;
  const samples = obj.tourism_samples;

  if (!Array.isArray(samples)) {
    throw new Error('Invalid tourism dataset: tourism_samples is not an array');
  }

  return samples.map((s, idx) => {
    if (typeof s !== 'object' || s === null) {
      throw new Error(`Invalid tourism sample at index ${idx}`);
    }

    const rec = s as Record<string, unknown>;

    const title = typeof rec.title === 'string' ? rec.title : '';
    const description =
      typeof rec.description === 'string' ? rec.description : '';

    if (!title.trim() || !description.trim()) {
      throw new Error(
        `Invalid tourism sample at index ${idx}: missing title/description`,
      );
    }

    const near = isStringArray(rec.near) ? rec.near : undefined;
    const region = typeof rec.region === 'string' ? rec.region : undefined;

    return { title, description, near, region };
  });
}

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

  private readonly EMBEDDING_DIM = 1536;

  // locale-stable sorting (prevents env differences)
  private readonly collator = new Intl.Collator('en', {
    numeric: true,
    sensitivity: 'base',
  });

  private createClient(): Client {
    const dbUrl = this.configService.get<string>('DATABASE_URL');

    if (dbUrl) {
      return new Client({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=')
          ? { rejectUnauthorized: false }
          : undefined,
      });
    }

    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: String(this.configService.get<string>('DB_PASSWORD') || ''),
      port: Number(this.configService.get<string>('DB_PORT')),
    });
  }

  private normalizeText(v: unknown): string {
    if (typeof v !== 'string') return '';
    return v.trim().replace(/\s+/g, ' ');
  }

  private buildContentWithMeta(item: TourismSample): string {
    const near = Array.isArray(item.near)
      ? item.near.map((x) => String(x).trim()).filter(Boolean)
      : [];

    const region = typeof item.region === 'string' ? item.region.trim() : '';

    const metaLines: string[] = [];
    if (near.length) metaLines.push(`Near: ${near.join(', ')}`);
    if (region) metaLines.push(`Region: ${region}`);

    return metaLines.length
      ? `${item.description}\n\n${metaLines.join('\n')}`
      : item.description;
  }

  private parseVectorToNumberArray(raw: unknown, rowId?: string): number[] {
    if (Array.isArray(raw)) {
      if (raw.every((x) => typeof x === 'number')) return raw;

      if (raw.every((x) => typeof x === 'string')) {
        const nums = raw.map((s) => Number(s));
        if (nums.every((n) => Number.isFinite(n))) return nums;
      }
    }

    if (typeof raw === 'string') {
      const s = raw.trim();

      try {
        const parsed: unknown = JSON.parse(s);
        if (
          Array.isArray(parsed) &&
          parsed.every((x) => typeof x === 'number')
        ) {
          return parsed;
        }
      } catch {
        // ignore
      }

      const cleaned = s.replace(/^\[|\]$/g, '').replace(/^\{|\}$/g, '');
      const parts = cleaned
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const nums = parts.map((p) => Number(p));
      if (nums.length && nums.every((n) => Number.isFinite(n))) return nums;
    }

    throw new Error(
      `Invalid embedding format for row id ${rowId ?? 'unknown'}`,
    );
  }

  // fixed precision to prevent float string drift
  private vectorToLiteral(vec: number[], decimals = 8): string {
    // Ensure stable string formatting across runs/env
    const parts = vec.map((n) => {
      if (!Number.isFinite(n)) return '0';
      // keep consistent decimals
      return Number(n).toFixed(decimals);
    });
    return `[${parts.join(',')}]`;
  }

  async seedEmbeddings(): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      // Deterministic seeding: stable IDs every time
      await client.query(`TRUNCATE TABLE embeddings RESTART IDENTITY`);

      const dataset = parseTourismSamples(rawTourismData as unknown);

      // Deterministic order
      dataset.sort((a, b) => this.collator.compare(a.title, b.title));

      for (const item of dataset) {
        const title = this.normalizeText(item.title);
        const contentWithMeta = this.buildContentWithMeta(item);

        const textForEmbedding = `${title}. ${contentWithMeta}`;
        const embedding = this.generateDummyEmbedding(
          textForEmbedding,
          this.EMBEDDING_DIM,
        );

        // Deterministic float serialization
        const vectorLiteral = this.vectorToLiteral(embedding);

        await client.query(
          `INSERT INTO embeddings (title, content, embedding)
           VALUES ($1, $2, $3::vector)`,
          [title, contentWithMeta, vectorLiteral],
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Seeding error:', err);
      throw err;
    } finally {
      await client.end();
    }
  }

  async getAllEmbeddings(): Promise<EmbeddingItem[]> {
    const client = this.createClient();

    try {
      await client.connect();
      const result = await client.query<EmbeddingRow>(
        `SELECT id, title, content, embedding
         FROM embeddings
         ORDER BY id ASC`,
      );

      // SQL already ordered deterministically by id ASC
      return result.rows.map((row) => {
        const embeddingArray = this.parseVectorToNumberArray(
          row.embedding,
          row.id,
        );

        return {
          id: String(row.id),
          title: row.title,
          content: row.content,
          embedding: embeddingArray,
        };
      });
    } finally {
      await client.end();
    }
  }

  async searchEmbeddings(
    vector: number[],
    limit: number = 5,
  ): Promise<(EmbeddingItem & { score: number })[]> {
    const client = this.createClient();

    try {
      await client.connect();

      // stable vector literal
      const vectorStr = this.vectorToLiteral(vector);

      // Stable ordering: distance ASC, id ASC
      // Score is derived deterministically from distance
      const query = `
        SELECT id, title, content, embedding,
               1 - (embedding <=> $1) as score
        FROM embeddings
        ORDER BY (embedding <=> $1) ASC, id ASC
        LIMIT $2
      `;

      const result = await client.query<{
        id: number | string;
        title: string;
        content: string;
        embedding: unknown;
        score: number;
      }>(query, [vectorStr, limit]);

      // SQL already stable; keep JS mapping only
      return result.rows.map((row) => {
        const embeddingArray = this.parseVectorToNumberArray(
          row.embedding,
          String(row.id),
        );
        return {
          id: String(row.id),
          title: row.title,
          content: row.content,
          embedding: embeddingArray,
          score: Number(row.score),
        };
      });
    } finally {
      await client.end();
    }
  }

  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) return Array.from({ length: dim }, () => 0);

    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const vector: number[] = Array.from({ length: dim }, () => 0);

    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex];
      const ngrams = this.getCharNGrams(token, 3);

      for (const ng of ngrams) {
        const hash = this.hashToken(ng);

        for (let i = 0; i < dim; i++) {
          // Pure deterministic math
          vector[i] += (((hash + i * 13) % 100) / 100) * (1 / (tokenIndex + 1));
        }
      }
    }

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
  }

  private getCharNGrams(word: string, n: number): string[] {
    if (!word) return [''];
    if (word.length < n) return [word];

    const ngrams: string[] = [];
    for (let i = 0; i <= word.length - n; i++) {
      ngrams.push(word.substring(i, i + n));
    }
    return ngrams;
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) % 100000;
    }
    return hash;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    return magA && magB ? dot / (magA * magB) : 0;
  }

  isPartialMatch(token: string, text: string): boolean {
    if (!token || token.length < 4) return false;
    if (!text) return false;

    const t = token.toLowerCase();
    const hay = text.toLowerCase();

    for (let i = 0; i <= t.length - 4; i++) {
      const sub = t.substring(i, i + 4);
      if (hay.includes(sub)) return true;
    }
    return false;
  }
}
