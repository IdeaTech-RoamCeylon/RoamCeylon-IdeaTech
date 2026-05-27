import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AIService } from '../ai.service';

@Controller('ai/chat')
export class ChatNlpController {
  constructor(private readonly aiService: AIService) {}

  @Post('extract')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 requests per minute
  async extractParams(
    @Body()
    body: {
      userMessage: string;
      existingParams: Record<string, unknown>;
    },
  ) {
    return this.aiService.extractTripParameters(
      body.userMessage,
      body.existingParams,
    );
  }
}
