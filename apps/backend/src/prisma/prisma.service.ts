import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    const url = process.env.DATABASE_URL;
    if (url) {
      const redacted = url.replace(/:([^@]+)@/, ':****@');
      console.log(`[PrismaService] Connecting with DATABASE_URL: ${redacted}`);
    } else {
      console.log('[PrismaService] DATABASE_URL is not set!');
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
