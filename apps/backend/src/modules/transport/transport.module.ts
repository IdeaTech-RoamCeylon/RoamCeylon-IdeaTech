import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportGateway } from './transport.gateway';

@Module({
  controllers: [TransportController],
  providers: [TransportService, TransportGateway],
})
export class TransportModule { }
