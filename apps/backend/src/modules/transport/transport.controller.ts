import { Controller, Get, Post, Logger } from '@nestjs/common';
import { TransportService } from './transport.service';
import { Driver } from './item.interface';

@Controller('transport')
export class TransportController {
  private readonly logger = new Logger(TransportController.name);

  constructor(private readonly transportService: TransportService) { }

  @Post('seed')
  seedData() {
    this.logger.log('Seeding transport data...');
    const drivers = this.transportService.seedDrivers();
    const rides = this.transportService.seedRideRequests();
    return { drivers, rides };
  }

  @Get('simulate')
  simulate() {
    this.logger.log('Simulating transport data...');
    return this.transportService.simulate();
  }

  @Get('drivers')
  getDrivers(): Driver[] {
    this.logger.log('Fetching drivers...');
    return this.transportService.getDrivers();
  }
}
