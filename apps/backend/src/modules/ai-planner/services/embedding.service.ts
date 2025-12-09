import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import tourismData from '../data/sample-tourism.json';

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

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

      const res = await client.query('SELECT NOW()');
      console.log('PostgreSQL current time:', res.rows[0]);

      // Optional: clear old embeddings
      await client.query(`DELETE FROM embeddings`);

      const dataset = tourismData.tourism_samples;

      for (const item of dataset) {
        // Generate 1536-dim embedding
        const embedding = this.generateDummyEmbedding(item.description, 1536);

        // Convert JS array to PostgreSQL vector literal
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

  // ------------------ FETCH ALL ------------------
  async getAllEmbeddings() {
    const client = this.createClient();

    try {
      await client.connect();
      const result = await client.query(
        `SELECT id, title, content, embedding FROM embeddings`,
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding), // parse vector string into array
      }));
    } finally {
      await client.end();
    }
  }

  // ------------------ UTILS ------------------
  generateDummyEmbedding(text: string, dim = 1536): number[] {
    if (!text) return Array(dim).fill(0);
    return Array.from({ length: dim }, (_, i) => {
      const code = text.charCodeAt(i % text.length);
      return (code % 100) / 100;
    });
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
}
