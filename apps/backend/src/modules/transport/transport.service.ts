import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Driver, RideRequest } from './item.interface';

export interface Wrapper<T> {
  data: T;
  meta?: {
    count: number;
    timestamp: string;
    [key: string]: any;
  };
}

@Injectable()
export class TransportService {
  private readonly logger = new Logger('TransportService');

  constructor(private readonly prisma: PrismaService) { }

  private wrapResponse<T>(data: T): Wrapper<T> {
    return {
      data,
      meta: {
        count: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async seedDrivers() {
    this.logger.log('Seeding drivers into PostGIS...');

    const driversData = [
      // Colombo Area (Existing + New)
      { id: 'd1', name: 'Kamal Perera', lat: 6.9271, lng: 79.8612 }, // Colombo
      { id: 'd2', name: 'Nimal Silva', lat: 6.9319, lng: 79.8475 }, // Pettah
      { id: 'd3', name: 'Sunil Cooray', lat: 6.9023, lng: 79.8596 }, // Bambalapitiya

      // Kandy Area
      { id: 'd4', name: 'Duminda Alwis', lat: 7.2906, lng: 80.6337 }, // Kandy Town
      { id: 'd5', name: 'Isuru Perera', lat: 7.2944, lng: 80.5987 }, // Peradeniya

      // Galle Area
      { id: 'd6', name: 'Sameera Appuhami', lat: 6.0329, lng: 80.2168 }, // Galle Fort
      { id: 'd7', name: 'Asiri Bandara', lat: 6.0394, lng: 80.2489 }, // Unawatuna

      // Nuwara Eliya Area
      { id: 'd8', name: 'Chamara Silva', lat: 6.9497, lng: 80.7891 }, // Nuwara Eliya
      { id: 'd9', name: 'Pradeep Kumara', lat: 6.9744, lng: 80.7824 }, // Lake Gregory
    ];

    try {
      await this.prisma.client.$transaction(async (tx) => {
        for (const d of driversData) {
          // Upsert User
          await tx.user.upsert({
            where: { id: d.id },
            update: { name: d.name },
            create: {
              id: d.id,
              name: d.name,
              phone: `+9477000000${d.id.replace('d', '')}`,
            },
          });

          // Delete old location to avoid uniqueness issues
          await tx.$executeRaw`DELETE FROM "DriverLocation" WHERE "driverId" = ${d.id}`;

          // Insert Location
          await tx.$executeRaw`
            INSERT INTO "DriverLocation" ("driverId", location, "updatedAt")
            VALUES (${d.id}, ST_SetSRID(ST_MakePoint(${d.lng}, ${d.lat}), 4326), NOW())
          `;
        }
      });
      return { message: 'Diverse drivers seeded to PostGIS', count: driversData.length };
    } catch (error) {
      this.logger.error(`Seeding failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to seed transport data');
    }
  }

  async getDrivers(
    lat?: number,
    lng?: number,
    limit: number = 5,
  ): Promise<Wrapper<Driver[]>> {
    const start = Date.now();

    try {
      if (lat === undefined || lng === undefined) {
        const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
          SELECT
            d."driverId" as id,
            u.name,
            ST_X(d.location::geometry) as lng,
            ST_Y(d.location::geometry) as lat
          FROM "DriverLocation" d
          LEFT JOIN "User" u ON d."driverId" = u.id
          ORDER BY d."driverId" ASC
          LIMIT ${limit}
        `;
        const duration = Date.now() - start;
        this.logger.log(`Found ${raw.length} drivers (no coords) in ${duration}ms`);
        return this.wrapResponse(this.mapToDriver(raw));
      }

      const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
        SELECT
          d."driverId" as id,
          u.name,
          ST_X(d.location::geometry) as lng,
          ST_Y(d.location::geometry) as lat,
          ST_DistanceSphere(d.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance
        FROM "DriverLocation" d
        LEFT JOIN "User" u ON d."driverId" = u.id
        WHERE ST_DWithin(
          d.location, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          0.2 /* Approx 20km radius limit */
        )
        ORDER BY d.location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        LIMIT ${limit}
      `;

      const duration = Date.now() - start;
      this.logger.log(`Found ${raw.length} drivers near [${lat}, ${lng}] in ${duration}ms`);
      return this.wrapResponse(this.mapToDriver(raw));
    } catch (error) {
      this.logger.error(`Error fetching drivers: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not retrieve drivers at this time');
    }
  }

  async createRide(passengerId: string, pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const session = await (this.prisma as any).transportSession.create({
        data: {
          passengerId,
          pickupLocation: pickup,
          destination,
          status: 'requested',
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return this.wrapResponse({ rideId: session.id, status: session.status });
    } catch (error) {
      this.logger.error(`Failed to create ride: ${(error as Error).message}`);
      throw new InternalServerErrorException('Could not create ride');
    }
  }

  async updateRideStatus(rideId: string, status: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = { status };
      if (status === 'completed') {
        data.endTime = new Date();
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const session = await (this.prisma as any).transportSession.update({
        where: { id: rideId },
        data,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return this.wrapResponse({ rideId: session.id, status: session.status });
    } catch (error) {
      this.logger.error(`Failed to update ride status: ${(error as Error).message}`);
      throw new InternalServerErrorException('Could not update ride status');
    }
  }

  async getRide(rideId: string, userId?: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const session = await (this.prisma as any).transportSession.findUnique({
        where: { id: rideId },
        select: { id: true, passengerId: true, status: true, driverId: true, fare: true }
      });

      if (!session) return this.wrapResponse(null);

      // Security check: ensure the requester is the passenger or driver
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userId && session.passengerId !== userId && session.driverId !== userId) {
        throw new Error('Access denied');
        // In a real app we'd throw ForbiddenException, but using Error to match current style
      }

      return this.wrapResponse(session);
    } catch (error) {
      this.logger.error(`Failed to get ride: ${(error as Error).message}`);
      throw new InternalServerErrorException('Could not fetch ride');
    }
  }

  getRideRequests(): Wrapper<RideRequest[]> {
    return this.wrapResponse([]);
  }

  simulate() {
    return this.seedDrivers();
  }

  private mapToDriver(rows: DriverRow[]): Driver[] {
    return rows.map((r) => {
      const distanceMetres = r.distance || 0;
      const distanceKm = distanceMetres / 1000;

      // Realistic ETA calculation:
      // < 500m -> "1 min"
      // Otherwise -> 1.5 mins per km + 1 min base arrival time
      let eta = 'Unknown';
      if (r.distance !== undefined) {
        if (distanceMetres < 500) {
          eta = '1 min';
        } else {
          const mins = Math.ceil(distanceKm * 1.5) + 1;
          eta = `${mins} mins`;
        }
      }

      return {
        id: r.id,
        name: r.name || 'Unknown Driver',
        lat: r.lat,
        lng: r.lng,
        status: 'available',
        eta,
      };
    });
  }
}

interface DriverRow {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  distance?: number;
}
