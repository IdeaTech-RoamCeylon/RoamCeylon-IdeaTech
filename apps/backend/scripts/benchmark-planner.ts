import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PlannerService } from '../src/modules/planner/planner.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const plannerService = app.get(PlannerService);
    const logger = new Logger('Benchmark');

    const userId = 'bench-user-' + Date.now();

    logger.log('🚀 Starting Benchmark for Planner API...');

    // 1. Create a Trip
    logger.log('1. Creating a fresh trip...');
    const trip = await plannerService.saveTrip(userId, {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        destination: 'Galle',
        itinerary: { day1: 'Beach' },
    });
    const tripId = trip.id;
    logger.log(`   Trip created with ID: ${tripId}`);

    // 2. First Fetch (Cache Miss)
    logger.log('2. Fetching Trip (Expected Cache Miss)...');
    const start1 = performance.now();
    await plannerService.getTrip(userId, tripId);
    const end1 = performance.now();
    logger.log(`   ⏱️ Time: ${(end1 - start1).toFixed(2)}ms`);

    // 3. Second Fetch (Cache Hit)
    logger.log('3. Fetching Trip Again (Expected Cache Hit)...');
    const start2 = performance.now();
    await plannerService.getTrip(userId, tripId);
    const end2 = performance.now();
    logger.log(`   ⏱️ Time: ${(end2 - start2).toFixed(2)}ms`);

    if (end2 - start2 < end1 - start1) {
        logger.log('✅ PASS: Cache logic is working (Second fetch was faster).');
    } else {
        logger.warn('⚠️ WARN: Cache might not be effective or overhead is high.');
    }

    // Cleanup
    await plannerService.deleteTrip(userId, tripId);
    await app.close();
}

bootstrap();
