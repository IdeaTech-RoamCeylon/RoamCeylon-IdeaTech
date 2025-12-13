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

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

  // ------------------ POSTGRES CLIENT ------------------
  private createClient(): Client {
    // Check if we have individual vars, otherwise use DATABASE_URL
    const dbUrl = this.configService.get<string>('DATABASE_URL');

    // If DATABASE_URL is present, use it for connection string
    if (dbUrl) {
      return new Client({
        connectionString: dbUrl,
        // Nhost requires SSL
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

  // ------------------ SEEDING ------------------
  async seedEmbeddings(): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      // Optional: clear old embeddings
      await client.query(`DELETE FROM embeddings`);

      const dataset = tourismData.tourism_samples;

      for (const item of dataset) {
        const embedding: number[] = this.generateDummyEmbedding(
          item.description,
          1536,
        );

        const vectorLiteral = `[${embedding.join(',')}]`;

        await client.query(
          `INSERT INTO embeddings (title, content, embedding)
           VALUES ($1, $2, $3::vector)`,
          [item.title, item.description, vectorLiteral],
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
        // JSON.parse safely typed as unknown first
        const parsed: unknown = JSON.parse(row.embedding);

        // Validate it is an array of numbers
        if (
          !Array.isArray(parsed) ||
          !parsed.every((x) => typeof x === 'number')
        ) {
          throw new Error(`Invalid embedding format for row id ${row.id}`);
        }

        // Cast to number[] safely
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

  // ------------------ UTILS ------------------
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) return Array.from({ length: dim }, () => 0);

    // Lowercase, remove non-alphanumeric except space
    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    // Tokenize words (split on spaces)
    const tokens = cleaned.split(/\s+/);

    const vector: number[] = Array.from({ length: dim }, () => 0);

    tokens.forEach((token, index) => {
      // Also split tokens into character-level n-grams for better matching
      const ngrams = this.getCharNGrams(token, 3); // trigrams
      ngrams.forEach((ng) => {
        const hash = this.hashToken(ng);
        for (let i = 0; i < dim; i++) {
          vector[i] += (((hash + i * 13) % 100) / 100) * (1 / (index + 1));
        }
      });
    });

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
  }

  // Generate character n-grams
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

    // gallefort → galle fort
    for (let i = 0; i <= token.length - 4; i++) {
      const sub = token.substring(i, i + 4);
      if (text.includes(sub)) return true;
    }
    return false;
  }
}
