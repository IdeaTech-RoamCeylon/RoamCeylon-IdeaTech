import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransportService, Wrapper } from './transport.service';
import { Driver } from './item.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { GetDriversDto } from './dto/get-drivers.dto';
import { ThrottlerGuard } from '../../common/guards/throttler.guard';

@Controller('transport')
@UseGuards(JwtAuthGuard)
export class TransportController {
  private readonly logger = new Logger('TransportController');

  constructor(private readonly transportService: TransportService) { }

  @Post('seed')
  seedData() {
    return this.transportService.seedDrivers();
  }

  @Get('simulate')
  simulate() {
    return this.transportService.simulate();
  }

  @Get('drivers')
  @UseGuards(ThrottlerGuard)
  getDrivers(@Query() query: GetDriversDto): Promise<Wrapper<Driver[]>> {
    const { lat, lng, limit } = query;
    return this.transportService.getDrivers(lat, lng, limit);
  }

  @Post('ride')
  async createRide(@Body() body: { passengerId: string, pickup: any, destination: any }) {
    return this.transportService.createRide(body.passengerId, body.pickup, body.destination);
  }

  @Post('ride/status')
  async updateRideStatus(@Body() body: { rideId: number, status: string }) {
    return this.transportService.updateRideStatus(body.rideId, body.status);
  }

  /**
   * RIDE STATUS (Sprint 3)
   * Tracks real-time ride progress from the database.
   */
  @Get('ride-status')
  async getRideStatus(@Query('rideId') rideId: string) {
    this.logger.log(`[Sprint 3] Fetching ride status for ID: ${rideId}`);

    // Parse ID safely
    const parsedId = parseInt(rideId, 10);
    if (isNaN(parsedId)) {
      return {
        data: { status: 'unknown', message: 'Invalid ID' },
        meta: { timestamp: new Date().toISOString() }
      };
    }

    const result = await this.transportService.getRide(parsedId);

    return {
      data: result.data || { status: 'not_found' },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'Sprint 3 Live',
      },
    };
  }
}
