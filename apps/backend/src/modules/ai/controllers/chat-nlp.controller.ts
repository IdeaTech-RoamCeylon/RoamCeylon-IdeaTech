import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AIService } from '../ai.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@Controller('ai/chat')
@UseGuards(JwtAuthGuard)
export class ChatNlpController {
  constructor(private readonly aiService: AIService) {}

  @Post('extract')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 requests per minute
  async extractParams(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      userMessage: string;
      existingParams: Record<string, unknown>;
      sessionId?: string;
    },
  ) {
    return this.aiService.extractTripParameters(
      body.userMessage,
      body.existingParams,
      req.user.userId,
      body.sessionId,
    );
  }

  @Get('history')
  async getHistory(@Req() req: RequestWithUser) {
    return this.aiService.getChatSessions(req.user.userId);
  }

  @Get('history/:sessionId')
  async getChatMessages(
    @Req() req: RequestWithUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiService.getChatMessages(req.user.userId, sessionId);
  }
}
