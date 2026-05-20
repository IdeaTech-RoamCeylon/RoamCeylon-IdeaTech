// apps/backend/src/modules/health/health.module.ts

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
