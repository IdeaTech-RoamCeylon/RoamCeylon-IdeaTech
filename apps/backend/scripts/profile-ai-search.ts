
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AIController } from '../src/modules/ai/ai.controller';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('Profiler');
    const app = await NestFactory.createApplicationContext(AppModule);
    const aiController = app.get(AIController);

    logger.log('Starting AI Search Profiling...');

    // Warmup
    logger.log('Warming up...');
    await aiController.search({ query: 'beach' });

    // Test cases
    const queries = [
        'beach vacation with family',
        'adventure hiking in mountains',
        'historical temples and culture',
        'relaxing spa weekend',
        'colombo city tour',
    ];

    logger.log('Running profiles...');

    for (const query of queries) {
        const start = process.hrtime.bigint();
        await aiController.search({ query });
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // ms

        logger.log(`Query: "${query}" - Duration: ${duration.toFixed(2)} ms`);
    }

    logger.log('Profiling complete.');
    await app.close();
}

bootstrap();
