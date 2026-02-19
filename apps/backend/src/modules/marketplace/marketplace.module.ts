import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IoRedisStore } from '@tirke/node-cache-manager-ioredis';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: IoRedisStore,
        url: configService.get('REDIS_URL') || 'redis://localhost:6379',
        ttl: 600,
      }),
    }),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
