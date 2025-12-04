import { Injectable } from '@nestjs/common';

@Injectable()
export class AIService {
    health() {
        return 'AI module running';
    }
}
