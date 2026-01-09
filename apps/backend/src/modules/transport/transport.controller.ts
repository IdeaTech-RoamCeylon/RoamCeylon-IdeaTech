import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { TransportService } from './transport.service';
import { NearbyDriversQueryDto, AcceptRideDto } from './dto/transport.dto';

@Controller('transport')
export class TransportController {
    constructor(private readonly transportService: TransportService) { }

    @Get('drivers/nearby')
    async getNearbyDrivers(@Query() query: NearbyDriversQueryDto) {
        return this.transportService.findNearbyDrivers(query.lat, query.lng, query.radius);
    }

    @Post('accept-ride')
    async acceptRide(@Body() dto: AcceptRideDto) {
        return this.transportService.acceptRide(dto.rideId, dto.driverId);
    }
}
