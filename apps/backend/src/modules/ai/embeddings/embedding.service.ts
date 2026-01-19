import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import tourismData from '../data/sample-tourism.json';

// Type for a raw row from the database
interface EmbeddingRow {
  id: string;
  title: string;
  content: string;
  embedding: string; // stored as JSON string in DB
}

// Type for embedding item returned by service
export interface EmbeddingItem {
  id: string;
  title: string;
  content: string;
  embedding: number[];
}

/**
 * Optional: extend JSON item shape (works even if your JSON doesn't have near/region yet)
 */
type TourismSample = {
  title: string;
  description: string;
  near?: string[];
  region?: string;
};

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) { }

  // ------------------ POSTGRES CLIENT ------------------
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

  // Build content with metadata so search + embeddings pick near places
  private buildContentWithMeta(item: TourismSample): string {
    const near = Array.isArray(item.near)
      ? item.near.map((x) => String(x).trim()).filter(Boolean)
      : [];

    const region = typeof item.region === 'string' ? item.region.trim() : '';

    // Put metadata in plain text (keyword gate + embedding will see it)
    const metaLines: string[] = [];
    if (near.length) metaLines.push(`Near: ${near.join(', ')}`);
    if (region) metaLines.push(`Region: ${region}`);

    return metaLines.length
      ? `${item.description}\n\n${metaLines.join('\n')}`
      : item.description;
  }

  // ------------------ SEEDING ------------------
  async seedEmbeddings(): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      // Optional: clear old embeddings
      await client.query(`DELETE FROM embeddings`);

      // Ensure we treat dataset items as TourismSample
      const dataset = (tourismData as { tourism_samples: TourismSample[] })
        .tourism_samples;

      for (const item of dataset) {
        const contentWithMeta = this.buildContentWithMeta(item);

        // Embed title + content (better separation than description only)
        const textForEmbedding = `${item.title}. ${contentWithMeta}`;

        const embedding: number[] = this.generateDummyEmbedding(
          textForEmbedding,
          1536,
        );

        const vectorLiteral = `[${embedding.join(',')}]`;

        await client.query(
          `INSERT INTO embeddings (title, content, embedding)
           VALUES ($1, $2, $3::vector)`,
          [item.title, contentWithMeta, vectorLiteral],
        );
      }
    } catch (err) {
      console.error('Seeding error:', err);
      throw err;
    } finally {
      await client.end();
    }
  }

  // ------------------ FETCH ALL EMBEDDINGS ------------------
  async getAllEmbeddings(): Promise<EmbeddingItem[]> {
    const client = this.createClient();

    try {
      await client.connect();
      const result = await client.query<EmbeddingRow>(
        `SELECT id, title, content, embedding FROM embeddings`,
      );

      const embeddings: EmbeddingItem[] = [];

      for (const row of result.rows) {
        const parsed: unknown = JSON.parse(row.embedding);

        if (
          !Array.isArray(parsed) ||
          !parsed.every((x) => typeof x === 'number')
        ) {
          throw new Error(`Invalid embedding format for row id ${row.id}`);
        }

        const embeddingArray: number[] = parsed;

        embeddings.push({
          id: row.id,
          title: row.title,
          content: row.content,
          embedding: embeddingArray,
        });
      }

      return embeddings;
    } finally {
      await client.end();
    }
  }

  // ------------------ VECTOR SEARCH ------------------
  async searchEmbeddings(vector: number[], limit: number = 5): Promise<(EmbeddingItem & { score: number })[]> {
    const client = this.createClient();
    try {
      await client.connect();
      const vectorStr = `[${vector.join(',')}]`;

      // Use cosine distance operator (<=>). 
      // 1 - (a <=> b) = cosine_similarity
      const query = `
        SELECT id, title, content, embedding, 
        1 - (embedding <=> $1) as score
        FROM embeddings
        ORDER BY embedding <=> $1
        LIMIT $2
      `;

      const result = await client.query(query, [vectorStr, limit]);

      return result.rows.map(row => {
        // Parse embedding if needed, though for search we mostly need metadata + score
        // Postgres returns JSON string or object depending on driver config, usually string for custom types
        let embeddingArray: number[] = [];
        try {
          embeddingArray = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
        } catch (e) { embeddingArray = [] }

        return {
          id: String(row.id),
          title: row.title,
          content: row.content,
          embedding: embeddingArray,
          score: Number(row.score)
        };
      });
    } finally {
      await client.end();
    }
  }

  // ------------------ UTILS ------------------
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) return Array.from({ length: dim }, () => 0);

    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    const tokens = cleaned.split(/\s+/);

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
