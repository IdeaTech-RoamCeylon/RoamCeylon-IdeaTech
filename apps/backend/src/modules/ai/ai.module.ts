import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { EmbeddingService } from './embedding.service';

@Module({
  controllers: [AIController],
  providers: [AIService, EmbeddingService],
})
export class AIModule {}
