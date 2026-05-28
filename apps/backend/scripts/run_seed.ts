// apps/backend/scripts/run_seed.ts
import { EmbeddingService } from '../src/modules/ai/embeddings/embedding.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const configMock = {
  get: (key: string) => process.env[key],
} as unknown as ConfigService;

const embeddingService = new EmbeddingService(configMock);

async function main() {
  console.log('Seeding embeddings database with new Sri Lanka travel locations...');
  await embeddingService.seedEmbeddings();
  console.log('Embedding seeding completed successfully!');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
