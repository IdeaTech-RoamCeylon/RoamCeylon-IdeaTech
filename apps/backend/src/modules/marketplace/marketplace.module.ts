import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  controllers: [MarketplaceController],
<<<<<<< HEAD
  providers: [MarketplaceService]
=======
  providers: [MarketplaceService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class MarketplaceModule {}
