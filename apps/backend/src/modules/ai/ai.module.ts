import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10,  // 10 requests per ttl
      },
    ]),
  ],
  controllers: [AIController],
  providers: [AIService, EmbeddingService, SearchService],
})
export class AIModule {}
