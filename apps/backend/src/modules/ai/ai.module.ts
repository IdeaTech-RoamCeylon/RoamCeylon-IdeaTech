import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';

@Module({
<<<<<<< HEAD
    controllers: [AIController],
    providers: [AIService],
    exports: [AIService],
=======
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class AIModule {}
