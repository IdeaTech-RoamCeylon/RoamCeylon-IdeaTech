import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopsModule } from './shops/shops.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ShopsModule, AdminUsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
