import { Global, Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

// Global so VerifiedGuard (used across rooms/hotels/shops/activities/tour-guide)
// can inject VerificationService without each module importing this one.
@Global()
@Module({
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
