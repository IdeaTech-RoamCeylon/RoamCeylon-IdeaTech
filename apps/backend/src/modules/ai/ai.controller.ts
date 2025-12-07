import { Controller, Get } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
<<<<<<< HEAD
    constructor(private readonly aiService: AIService) { }

    @Get('health')
    health() {
        return this.aiService.health();
    }
=======
  constructor(private readonly aiService: AIService) {}

  @Get('health')
  health() {
    return this.aiService.health();
  }
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
}
