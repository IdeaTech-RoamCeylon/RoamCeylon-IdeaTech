import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly prisma: PrismaService) { }

  health() {
    return 'AI module running';
  }

  async seedEmbeddings() {
    this.logger.log('Starting legacy AI seeding...');
    const descriptions = [
      'Beautiful sandy beaches with crystal clear water.',
      'Ancient ruins from the 12th century.',
      'Lush green tea plantations in the hill country.',
      'Wildlife safari with elephants and leopards.',
      'Bustling city life with vibrant markets.',
      'Serene temples and religious sites.',
      'Scenic train rides through the mountains.',
      'Delicious local cuisine and street food.',
      'Surfing spots with great waves.',
      'Relaxing ayurvedic spas and wellness centers.',
    ];

    try {
      for (const text of descriptions) {
        const vector = Array.from({ length: 1536 }, () => Math.random());
        const vectorString = `[${vector.join(',')}]`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
          text,
          vectorString,
        );
      }
      this.logger.log('Legacy AI seeding completed successfully');
      return { success: true, message: 'Embeddings seeded' };
    } catch (error) {
      this.logger.error('Legacy AI seeding failed', error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
