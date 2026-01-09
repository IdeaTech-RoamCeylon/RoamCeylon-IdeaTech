import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransportService {
    private readonly logger = new Logger(TransportService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Finds nearby drivers using PostGIS ST_DWithin and KNN operator (<->).
     * This query is optimized to use the GIST index on the location column.
     */
    async findNearbyDrivers(lat: number, lng: number, radiusMeters: number = 5000) {
        this.logger.log(`Searching for drivers near lat: ${lat}, lng: ${lng} within ${radiusMeters}m`);

        // Using queryRaw because Prisma doesn't natively support PostGIS spatial functions well
        // ST_MakePoint(longitude, latitude) - Note that PostGIS uses (Long, Lat) order.
        // ::geography is used for ST_DWithin to handle meters correctly on a sphere.
        // <-> is the KNN operator for fast distance sorting using the GIST index.
        const drivers = await this.prisma.$queryRaw`
      SELECT 
        "driverId", 
        ST_X(location::geometry) as lng, 
        ST_Y(location::geometry) as lat,
        ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance
      FROM "DriverLocation"
      WHERE ST_DWithin(
        location::geography, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 
        ${radiusMeters}
      )
      ORDER BY location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry
      LIMIT 10;
    `;

        return drivers;
    }

    /**
     * Atomic update to accept a ride request, preventing race conditions.
     * This uses updateMany with a status check to ensure atomicity.
     */
    async acceptRide(rideId: number, driverId: string) {
        const result = await this.prisma.rideRequest.updateMany({
            where: {
                id: rideId,
                status: 'PENDING',
            },
            data: {
                status: 'ACCEPTED',
                driverId: driverId,
            },
        });

        if (result.count === 0) {
            throw new Error('Ride already accepted or not found');
        }

        return { success: true };
    }
}
