import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { EmbeddingService } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AIController],
  providers: [EmbeddingService, SearchService],
})
export class AIModule {}
