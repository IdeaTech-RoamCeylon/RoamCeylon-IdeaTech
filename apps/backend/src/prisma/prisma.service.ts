import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
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
    return this.prisma.driverLocation;
  }

  get rideRequest() {
    return this.prisma.rideRequest;
  }

  get savedTrip() {
    return this.prisma.savedTrip;
  }

  get plannerFeedback() {
    return this.prisma.plannerFeedback;
  }

  get userFeedbackSignal() {
    return this.prisma.userFeedbackSignal;
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
