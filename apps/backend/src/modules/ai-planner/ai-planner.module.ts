import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiPlannerService } from './ai-planner.service';
import { AiPlannerController } from './ai-planner.controller';
import { EmbeddingService } from './services/embedding.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AiPlannerController],
  providers: [AiPlannerService, EmbeddingService],
})
export class AiPlannerModule {}
