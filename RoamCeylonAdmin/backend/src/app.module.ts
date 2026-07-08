import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShopsModule } from './shops/shops.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PrismaModule } from './prisma/prisma.module';
import { TourGuideModule } from './tour-guide/tour-guide.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { RoomsModule } from './rooms/rooms.module';
import { HotelsModule } from './hotels/hotels.module';

import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ShopsModule,
    AdminUsersModule,
    TourGuideModule,
    UsersModule,
    NotificationsModule,
    ActivitiesModule,
    RoomsModule,
    HotelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
