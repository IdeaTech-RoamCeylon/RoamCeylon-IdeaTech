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

  /**
   * Create a deterministic dummy embedding for testing (no external API).
   * Returns a number[] of length dim.
   */
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) {
      return new Array<number>(dim).fill(0);
    }
    return new Array<number>(dim).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length);
      return (code % 100) / 100;
    });
  }

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

      console.log('Seeding completed!');
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
}
