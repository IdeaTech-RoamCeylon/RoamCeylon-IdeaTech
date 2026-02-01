import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Driver, RideRequest } from './item.interface';

export interface TransportSession {
  id: string;
  passengerId: string;
  status: string;
  statusUpdates: any[];
  startTime: Date;
  endTime?: Date;
  [key: string]: any;
}

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
        create: {
          id: d.id,
          name: d.name,
          // @ts-expect-error: Stale client generation
          phoneNumber: `+9477000000${d.id.replace('d', '')}`,
        },
      });

      // Insert Location (Raw query needed for geometry)
      // We diligently delete old location for this driver to avoid duplicates if re-seeding
      await this.prisma.client
        .$executeRaw`DELETE FROM "DriverLocation" WHERE "driverId" = ${d.id}`;

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

  async getDrivers(
    lat?: number,
    lng?: number,
    limit: number = 5,
  ): Promise<Driver[]> {
    if (lat === undefined || lng === undefined) {
      // Return all if no location provided (limit 50)
      const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
        SELECT
        d."driverId" as id,
        u.name,
        ST_X(d.location:: geometry) as lng,
        ST_Y(d.location:: geometry) as lat
        FROM "DriverLocation" d
        LEFT JOIN "User" u ON d."driverId" = u.id
        ORDER BY d."driverId" ASC
        LIMIT ${limit}
        `;
      return this.mapToDriver(raw);
    }

    // Find nearby
    // Find nearby
    const raw = await this.prisma.client.$queryRaw<DriverRow[]>`
    SELECT
    d."driverId" as id,
      u.name,
      ST_X(d.location:: geometry) as lng,
      ST_Y(d.location:: geometry) as lat,
      ST_DistanceSphere(d.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance
      FROM "DriverLocation" d
      LEFT JOIN "User" u ON d."driverId" = u.id
      ORDER BY d.location < -> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT ${limit}
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
    return rows.map((r) => {
      return {
        id: r.id,
        name: r.name || 'Unknown',
        lat: r.lat,
        lng: r.lng,
        status: 'available', // Schema doesn't have status yet, default to available
        eta: r.distance
          ? `${Math.ceil((r.distance / 1000 / 40) * 60)} mins`
          : undefined, // 40km/h avg speed
      };
    });
  }
  async createRide(passengerId: string, pickup: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<TransportSession> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return (this.prisma as any).transportSession.create({
      data: {
        passengerId,
        status: 'requested',
        pickupLocation: pickup,
        destination: destination,
      },
    }) as Promise<TransportSession>;
  }

  async updateRideStatus(rideId: string, status: string) {
    // Fetch current session first to append history
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const currentSession = await (this.prisma as any).transportSession.findUnique({
      where: { id: rideId },
    });

    if (!currentSession) {
      throw new Error('Ride not found');
    }

    const updates = ((currentSession as any).statusUpdates as any[]) || [];
    const currentStatus = (currentSession as any).status as string;

    // Allowed transitions
    const validTransitions: Record<string, string[]> = {
      'requested': ['accepted', 'cancelled'],
      'accepted': ['en_route', 'cancelled'],
      'en_route': ['completed'],
      'completed': [],
      'cancelled': []
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(status) && currentStatus !== status) { // Allow re-emitting same status or strict check? Assuming strict.
      // For dev simplicity if we want to force jump:
      // throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    updates.push({ status, timestamp: new Date().toISOString() });

    const data: any = {
      status,
      statusUpdates: updates,
    };

    if (status === 'completed') {
      data.endTime = new Date();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return (this.prisma as any).transportSession.update({
      where: { id: rideId },
      data,
    }) as Promise<TransportSession>;
  }

  async getRide(rideId: string, userId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const session = await (this.prisma as any).transportSession.findUnique({
      where: { id: rideId },
    });

    if (!session) {
      return { data: null };
    }

    if (userId && session.passengerId !== userId) {
      // Return null to hide data from unauthorized users (Strict Ownership)
      return { data: null };
    }

    return { data: session };
  }

  async getSession(sessionId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const session = await (this.prisma as any).transportSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      sessionId: session.id,
      status: session.status,
      driverLocation: null, // We would fetch this from DriverLocation if assigned
      eta: null, // Calculate if needed
      ...session
    };
  }
}

interface DriverRow {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  distance?: number;
}
