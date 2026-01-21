import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import tourismData from '../data/sample-tourism.json';

interface EmbeddingRow {
  id: string;
  title: string;
  content: string;
  embedding: any; // pgvector may come back as string like "[...]" or as array depending on config
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

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

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
    // Already an array
    if (Array.isArray(raw)) {
      if (raw.every((x) => typeof x === 'number')) return raw as number[];
      // Sometimes it can be array of strings
      if (raw.every((x) => typeof x === 'string')) {
        const nums = (raw as string[]).map((s) => Number(s));
        if (nums.every((n) => Number.isFinite(n))) return nums;
      }
    }

    // If it's a string, it can be:
    // - "[1,2,3]" (json-like)
    // - "[-0.1, 0.2, ...]" (json-like)
    // - "{1,2,3}" (array-like)
    // - "1,2,3" (csv)
    if (typeof raw === 'string') {
      const s = raw.trim();

      // Try JSON parse first
      try {
        const parsed = JSON.parse(s);
        if (
          Array.isArray(parsed) &&
          parsed.every((x) => typeof x === 'number')
        ) {
          return parsed as number[];
        }
      } catch {
        // ignore
      }

      // Try stripping braces/brackets then split
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

  async seedEmbeddings(): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      await client.query(`DELETE FROM embeddings`);

      const dataset = (tourismData as { tourism_samples: TourismSample[] })
        .tourism_samples;

      for (const item of dataset) {
        const title = this.normalizeText(item.title);
        const contentWithMeta = this.buildContentWithMeta(item);

        const textForEmbedding = `${title}. ${contentWithMeta}`;
        const embedding: number[] = this.generateDummyEmbedding(
          textForEmbedding,
          1536,
        );

        const vectorLiteral = `[${embedding.join(',')}]`;

        await client.query(
          `INSERT INTO embeddings (title, content, embedding)
           VALUES ($1, $2, $3::vector)`,
          [title, contentWithMeta, vectorLiteral],
        );
      }
    } catch (err) {
      // Keep logs deterministic and clean
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
        `SELECT id, title, content, embedding FROM embeddings`,
      );

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
      const vectorStr = `[${vector.join(',')}]`;

      const query = `
        SELECT id, title, content, embedding,
               1 - (embedding <=> $1) as score
        FROM embeddings
        ORDER BY embedding <=> $1
        LIMIT $2
      `;

      const result = await client.query<{
        id: number | string;
        title: string;
        content: string;
        embedding: any;
        score: number;
      }>(query, [vectorStr, limit]);

      return result.rows.map((row) => {
        let embeddingArray: number[] = [];
        try {
          embeddingArray = this.parseVectorToNumberArray(
            row.embedding,
            String(row.id),
          );
        } catch {
          embeddingArray = [];
        }

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
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const vector: number[] = Array.from({ length: dim }, () => 0);

    tokens.forEach((token, index) => {
      const ngrams = this.getCharNGrams(token, 3);
      ngrams.forEach((ng) => {
        const hash = this.hashToken(ng);
        for (let i = 0; i < dim; i++) {
          vector[i] += (((hash + i * 13) % 100) / 100) * (1 / (index + 1));
        }
      });
    });

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
  }

  private getCharNGrams(word: string, n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= word.length - n; i++) {
      ngrams.push(word.substring(i, i + n));
    }
    return ngrams.length > 0 ? ngrams : [word];
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
    if (token.length < 4) return false;

    for (let i = 0; i <= token.length - 4; i++) {
      const sub = token.substring(i, i + 4);
      if (text.includes(sub)) return true;
    }
    return false;
  }
}
