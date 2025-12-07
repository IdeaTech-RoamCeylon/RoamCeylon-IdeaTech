import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

@Module({
  controllers: [TransportController],
<<<<<<< HEAD
  providers: [TransportService]
=======
  providers: [TransportService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class TransportModule {}
