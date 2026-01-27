import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  UseGuards,
  Req,
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
  async createRide(@Req() req: any, @Body() body: { pickup: any, destination: any }) {
    // Force passengerId to be the authenticated user
    const passengerId = req.user.userId;
    return this.transportService.createRide(passengerId, body.pickup, body.destination);
  }

  @Post('ride/status')
  async updateRideStatus(@Body() body: { rideId: string, status: string }) {
    return this.transportService.updateRideStatus(body.rideId, body.status);
  }

  /**
   * RIDE STATUS (Sprint 3)
   * Tracks real-time ride progress from the database.
   */
  @Get('ride-status')
  async getRideStatus(@Req() req: any, @Query('rideId') rideId: string) {
    this.logger.log(`[Sprint 3] Fetching ride status for ID: ${rideId}`);

    if (!rideId) {
      return {
        data: { status: 'unknown', message: 'Missing ID' },
        meta: { timestamp: new Date().toISOString() }
      };
    }

    // Pass userId for security check
    const result = await this.transportService.getRide(rideId, req.user?.userId);

    return {
      data: result.data || { status: 'not_found' },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'Sprint 3 Live',
      },
    };
  }

  @Get('session/:id')
  async getSession(@Query('id') id: string) {
    // Skeleton implementation
    return {
      sessionId: id,
      status: 'active',
      driverLocation: { lat: 6.9271, lng: 79.8612 },
      eta: '5 mins'
    };
  }
}
