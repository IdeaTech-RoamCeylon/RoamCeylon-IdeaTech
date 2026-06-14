import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Retries the DB connection with exponential backoff.
   * Nhost free-tier databases go to sleep and need a few seconds to wake up.
   * This prevents a single failed $connect() from crashing the whole server.
   */
  private async connectWithRetry(maxAttempts = 10, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL via Prisma');
        return;
      } catch (err) {
        this.logger.warn(
          `DB connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs / 1000}s…`,
        );
        if (attempt === maxAttempts) {
          this.logger.error(
            'Could not connect to the database after all retries. The server will continue running and retry on next request.',
          );
          // Do NOT re-throw — let the server start and serve requests that don't need the DB
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        // Exponential backoff capped at 15 s
        delayMs = Math.min(delayMs * 1.5, 15_000);
      }
    }
  }

  /**
   * Reconnects on demand (called before DB operations when the connection may
   * have been lost while the free-tier database was asleep).
   */
  async ensureConnected() {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch {
      this.logger.warn('DB ping failed — attempting to reconnect…');
      await this.$disconnect().catch(() => undefined);
      await this.connectWithRetry(5, 2000);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
