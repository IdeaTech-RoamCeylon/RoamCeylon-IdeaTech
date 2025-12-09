import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import tourismData from '../data/sample-tourism.json';

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}

  private createDummyEmbeddingFromText(text: string, dim = 8): number[] {
    return Array.from(
      { length: dim },
      (_, i) => (text.charCodeAt(i % text.length) % 100) / 100,
    );
  }

  async seedEmbeddings(): Promise<void> {
    const client = new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: String(this.configService.get<string>('DB_PASSWORD') || ''),
      port: Number(this.configService.get<string>('DB_PORT')),
    });

    try {
      await client.connect();

      // Use imported JSON directly (no fs, no path issues)
      const dataset = tourismData.tourism_samples;

      for (const item of dataset) {
        const embedding = this.createDummyEmbeddingFromText(
          item.description,
          8,
        );

        await client.query(
          `
          INSERT INTO embeddings (item_id, title, content, embedding)
          VALUES ($1, $2, $3, $4)
          `,
          [item.id, item.title, item.description, embedding],
        );
      }
    } catch (err) {
      console.error('Seeding error:', err);
      throw err;
    } finally {
      console.log('Closing DB connection...');
      await client.end();
      console.log('🔌 Closed.');
    }
  }
}
