// apps/backend/src/modules/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as process from 'process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Loaded once at startup — resolves relative to the compiled output in dist/
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'),
) as { version: string };
const appVersion: string = pkg.version;

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /health
   *
   * Lightweight liveness check — no DB calls, responds even if DB is down.
   * Used by Docker HEALTHCHECK, load balancers, and Kubernetes readiness probes.
   *
   * For deep health including DB connectivity, use GET /health/deep.
   */
  @Get()
  check() {
    const uptimeMs = Date.now() - this.startTime;

    return {
      status: 'ok',
      version: appVersion,
      uptime: {
        ms: uptimeMs,
        seconds: Math.floor(uptimeMs / 1000),
        human: this.formatUptime(uptimeMs),
      },
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /health/deep
   *
   * Full connectivity check — pings the database with SELECT 1.
   * Use this for readiness checks that need to confirm the DB is reachable.
   * Not suitable for high-frequency polling (use /health for that).
   */
  @Get('deep')
  async deepCheck() {
    const uptimeMs = Date.now() - this.startTime;
    let dbStatus: 'connected' | 'unreachable' = 'unreachable';
    let dbLatencyMs: number | null = null;
    let dbError: string | undefined;

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - dbStart;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

    const overallStatus = dbStatus === 'connected' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      version: appVersion,
      uptime: {
        ms: uptimeMs,
        seconds: Math.floor(uptimeMs / 1000),
        human: this.formatUptime(uptimeMs),
      },
      environment: process.env.NODE_ENV ?? 'development',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
