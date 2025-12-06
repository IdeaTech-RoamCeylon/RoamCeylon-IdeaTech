import { Controller, Get } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
    constructor(private readonly aiService: AIService) { }

    @Get('health')
    health() {
        return this.aiService.health();
    }
}
