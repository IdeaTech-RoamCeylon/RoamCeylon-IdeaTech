import { Controller, Get } from '@nestjs/common';

@Controller('ai')
export class AiPlannerController {
<<<<<<< HEAD
    @Get('health')
    getHealth() {
        return 'AI Module Operational';
    }
=======
  @Get('health')
  getHealth() {
    return 'AI Module Operational';
  }
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
}
