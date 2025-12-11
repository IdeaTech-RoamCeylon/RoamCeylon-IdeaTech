import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';

@Module({
  imports: [ConfigModule],
  controllers: [AIController],
  providers: [AIService, EmbeddingService, SearchService],
})
export class AIModule {}
