// apps/backend/src/modules/health/health.controller.ts
//
// Simple health check endpoint — used by:
//   - Docker HEALTHCHECK instruction
//   - Load balancers and orchestrators (Kubernetes readiness probe)
//   - CI/CD pipeline pre-flight checks
//   - GET /api/ml/health (aggregated ML health) links back here for baseline

import { Controller, Get } from '@nestjs/common';
import * as process from 'process';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  /**
   * GET /health
   *
   * Returns 200 when the application is running and ready to serve traffic.
   * Intentionally lightweight — no DB calls, no external dependencies.
   * Deep health (DB, ML, cache) is available at GET /api/ml/health.
   */
  @Get()
  check() {
    const uptimeMs = Date.now() - this.startTime;

    return {
      status: 'ok',
      uptime: {
        ms: uptimeMs,
        seconds: Math.floor(uptimeMs / 1000),
        human: this.formatUptime(uptimeMs),
      },
      environment: process.env.NODE_ENV ?? 'development',
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
