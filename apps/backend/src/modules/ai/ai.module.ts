import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';
import { TripStoreService } from './trips/trip-store.service';
import { PlannerModule } from '../planner/planner.module';

@Module({
  imports: [
    ConfigModule,
    PlannerModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per ttl
      },
    ]),
  ],
  controllers: [AIController],
  providers: [AIService, EmbeddingService, SearchService, TripStoreService],
})
export class AIModule {}
