// apps/backend/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransportModule } from './modules/transport/transport.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AIModule } from './modules/ai/ai.module';
import { PlannerModule } from './modules/planner/planner.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsMiddleware } from './modules/analytics/analytics.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { LatencyTrackingInterceptor } from './common/interceptors/latency-tracking.interceptor';
import { LatencyTrackerService } from './modules/analytics/latency-tracker.service';
import { MlModule } from './modules/ml/ml.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TransportModule,
    MarketplaceModule,
    AIModule,
    PlannerModule,
    ScheduleModule.forRoot(),
    FeedbackModule,
    AnalyticsModule,
    AlertsModule,
    MlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LatencyTrackerService,
    {
      provide: APP_INTERCEPTOR, // registers globally
      useClass: LatencyTrackingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AnalyticsMiddleware).forRoutes('*'); // Apply to all routes
  }
}
