import { Controller, Get, Post } from '@nestjs/common';
import { TransportService } from './transport.service';
import { Driver } from './item.interface';

@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('seed')
  seedData() {
    const drivers = this.transportService.seedDrivers();
    const rides = this.transportService.seedRideRequests();
    return { drivers, rides };
  }

  @Get('drivers')
  getDrivers(): Driver[] {
    return this.transportService.getDrivers();
  }
}
