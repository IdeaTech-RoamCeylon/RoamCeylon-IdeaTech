import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import tourismData from '../data/sample-tourism.json';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Generates a dummy embedding for testing purposes.
   * Matches the 1536 dimensions defined in the schema.
   */
  private generateDummyEmbedding(text: string, dim = 1536): number[] {
    // Basic deterministic generation for consistent results
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from(
      { length: dim },
      (_, i) => Math.abs(Math.sin(seed + i))
    );
  }

  async seedEmbeddings(): Promise<void> {
    this.logger.log('Starting embedding seeding...');

    try {
      const dataset = tourismData.tourism_samples;

      for (const item of dataset) {
        const vector = this.generateDummyEmbedding(item.description);
        const vectorString = `[${vector.join(',')}]`;

        // Using findFirst/upsert would be better for stability, 
        // but for seeding we'll check if text already exists or just insert.
        // The schema has no unique constraint on text, so we'll just insert for now.

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
          `${item.title}: ${item.description}`,
          vectorString,
        );

        this.logger.debug(`Seeded: ${item.title}`);
      }

      this.logger.log('Seeding completed successfully');
    } catch (err) {
      this.logger.error('Seeding failure', err);
      throw new Error(`Failed to seed embeddings: ${err.message}`);
    }
  }
}
