import {
  Controller,
  Get,
  Post,
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
}
