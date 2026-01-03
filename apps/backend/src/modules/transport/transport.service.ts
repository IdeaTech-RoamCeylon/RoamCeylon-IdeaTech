import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Driver, RideRequest } from './item.interface';

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(private readonly prisma: PrismaService) { }

  async seedDrivers() {
    this.logger.log('Seeding drivers into PostGIS...');

    // 1. Create dummy users for drivers if they don't exist
    const driversData = [
      { id: 'd1', name: 'Kamal Perera', lat: 6.9271, lng: 79.8612 }, // Colombo
      { id: 'd2', name: 'Nimal Silva', lat: 6.9319, lng: 79.8475 }, // Pettah
      { id: 'd3', name: 'Sunil Cooray', lat: 6.9023, lng: 79.8596 }, // Bambalapitiya
    ];

    for (const d of driversData) {
      // Upsert User
      await this.prisma.user.upsert({
        where: { id: d.id },
        update: { name: d.name },
        create: { id: d.id, name: d.name, phone: `+9477000000${d.id.replace('d', '')}` },
      });

      // Insert Location (Raw query needed for geometry)
      // We diligently delete old location for this driver to avoid duplicates if re-seeding
      await this.prisma.client.$executeRaw`DELETE FROM "DriverLocation" WHERE "driverId" = ${d.id}`;

      await this.prisma.client.$executeRaw`
        INSERT INTO "DriverLocation" ("driverId", location, "updatedAt")
        VALUES (${d.id}, ST_SetSRID(ST_MakePoint(${d.lng}, ${d.lat}), 4326), NOW())
      `;
    }

    return { message: 'Drivers seeded to PostGIS', count: driversData.length };
  }

  seedRideRequests() {
    // Current requirement focuses on Drivers. 
    // We can leave this as a stub or implement similarly later.
    return { message: 'Ride requests seeding not yet migrated to PostGIS' };
  }

  async getDrivers(lat?: number, lng?: number): Promise<Driver[]> {
    if (lat === undefined || lng === undefined) {
      // Return all if no location provided (limit 50)
      const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
        SELECT 
            d."driverId" as id,
            u.name,
            ST_X(d.location::geometry) as lng, 
            ST_Y(d.location::geometry) as lat
        FROM "DriverLocation" d
        LEFT JOIN "User" u ON d."driverId" = u.id
        LIMIT 50
        `;
      return this.mapToDriver(raw);
    }

    // Find nearby
    const radius = 10000; // 10km
    const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
      SELECT 
        d."driverId" as id,
        u.name,
        ST_X(d.location::geometry) as lng, 
        ST_Y(d.location::geometry) as lat,
        ST_DistanceSphere(d.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance
      FROM "DriverLocation" d
      LEFT JOIN "User" u ON d."driverId" = u.id
      WHERE ST_DistanceSphere(d.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) < ${radius}
      ORDER BY distance ASC
    `;

    return this.mapToDriver(raw);
  }

  // Not implemented fully for this sprint task, keeping signature
  getRideRequests(): RideRequest[] {
    return [];
  }

  simulate() {
    return this.seedDrivers();
  }

  private mapToDriver(rows: DriverRow[]): Driver[] {
    return rows.map(r => ({
      id: r.id,
      name: r.name || 'Unknown',
      lat: r.lat,
      lng: r.lng,
      status: 'available', // Schema doesn't have status yet, default to available
    }));
  }
}

interface DriverRow {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
}
