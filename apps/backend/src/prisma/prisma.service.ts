import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    // Debug: Log the DATABASE_URL to see what Prisma is getting
    console.log('=== PRISMA DEBUG ===');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log(
      'DATABASE_URL substring:',
      process.env.DATABASE_URL?.substring(0, 50),
    );

    // Create a NEW Prisma Client instance with explicit datasource
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  // Expose Prisma Client methods
  get client() {
    return this.prisma;
  }

  // Delegate common methods
  get user() {
    return this.prisma.user;
  }

  get embeddings() {
    return this.prisma.embeddings;
  }

  get systemMetadata() {
    return this.prisma.systemMetadata;
  }

  get driverLocation() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.driverLocation;
  }

  get rideRequest() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.rideRequest;
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
