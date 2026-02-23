import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportGateway } from './transport.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [TransportController],
  providers: [TransportService, TransportGateway],
})
export class TransportModule {}
