import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopsModule } from './shops/shops.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ShopsModule,
    AdminUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
