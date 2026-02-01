import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { TransportService, TransportSession } from './transport.service';
import { Driver } from './item.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

import { GetDriversDto } from './dto/get-drivers.dto';
import { ThrottlerGuard } from '../../common/guards/throttler.guard';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

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
  getDrivers(@Query() query: GetDriversDto): Promise<Driver[]> {
    const { lat, lng, limit } = query;
    return this.transportService.getDrivers(lat, lng, limit);
  }

  @Post('ride')
  async createRide(
    @Req() req: RequestWithUser,
    @Body() body: { pickup: { lat: number; lng: number }; destination: { lat: number; lng: number } }
  ) {
    // Force passengerId to be the authenticated user
    const passengerId = req.user.userId;
    return this.transportService.createRide(passengerId, body.pickup, body.destination);
  }

  @Post('ride/status')
  async updateRideStatus(@Body() body: { rideId: string, status: string }): Promise<TransportSession> {
    return this.transportService.updateRideStatus(body.rideId, body.status);
  }

  /**
   * RIDE STATUS (Sprint 3)
   * Tracks real-time ride progress from the database.
   */
  @Get('ride-status')
  async getRideStatus(@Req() req: RequestWithUser, @Query('rideId') rideId: string) {
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
  async getSession(@Param('id') id: string): Promise<TransportSession> {
    return this.transportService.getSession(id);
  }
}
