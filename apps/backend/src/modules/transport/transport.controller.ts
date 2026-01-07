import {
  Controller,
  Get,
  Post,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TransportService } from './transport.service';
import { Driver } from './item.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('transport')
@UseGuards(JwtAuthGuard)
export class TransportController {
  private readonly logger = new Logger(TransportController.name);

  constructor(private readonly transportService: TransportService) {}

  @Post('seed')
  seedData() {
    this.logger.log('Seeding transport data...');
    return this.transportService.seedDrivers();
  }

  @Get('simulate')
  simulate() {
    this.logger.log('Simulating transport data...');
    return this.transportService.simulate();
  }

  @Get('drivers')
  @UseGuards(ThrottlerGuard)
  getDrivers(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit?: string,
  ): Promise<Driver[]> {
    this.logger.log(
      `Fetching drivers... location: ${lat}, ${lng}, limit: ${limit}`,
    );
    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lng ? parseFloat(lng) : undefined;
    const limitVal = limit ? parseInt(limit, 10) : 5;
    return this.transportService.getDrivers(latitude, longitude, limitVal);
  }
}
