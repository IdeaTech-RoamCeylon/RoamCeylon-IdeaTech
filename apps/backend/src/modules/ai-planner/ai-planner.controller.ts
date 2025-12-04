import { Controller, Get } from '@nestjs/common';

@Controller('ai')
export class AiPlannerController {
    @Get('health')
    getHealth() {
        return 'AI Module Operational';
    }
}
