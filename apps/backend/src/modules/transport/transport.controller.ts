import {
  Controller,
  Get,
  Post,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
// import { ThrottlerGuard } from '@nestjs/throttler';
import { TransportService } from './transport.service';
import { Driver } from './item.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { GetDriversDto } from './dto/get-drivers.dto';
import { ThrottlerGuard } from '../../common/guards/throttler.guard';

@Controller('transport')
@UseGuards(JwtAuthGuard)
export class TransportController {
  private readonly logger = new Logger(TransportController.name);

  constructor(private readonly transportService: TransportService) { }

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
  getDrivers(@Query() query: GetDriversDto): Promise<Driver[]> {
    const { lat, lng, limit } = query;
    this.logger.log(
      `Fetching drivers... location: ${lat}, ${lng}, limit: ${limit}`,
    );
    return this.transportService.getDrivers(lat, lng, limit);
  }
}
