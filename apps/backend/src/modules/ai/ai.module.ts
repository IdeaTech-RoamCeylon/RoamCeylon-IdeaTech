import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { EmbeddingService } from './embeddings/embedding.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Added from ai-planner.module
  ],
  controllers: [AIController],
  providers: [AIService, EmbeddingService],
})
export class AIModule {}
