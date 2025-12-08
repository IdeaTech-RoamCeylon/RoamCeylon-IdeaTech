import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AiPlannerModule } from './modules/ai-planner/ai-planner.module';
import { TransportModule } from './modules/transport/transport.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AIModule } from './modules/ai/ai.module';


@Module({
<<<<<<< HEAD
  imports: [AuthModule, UsersModule, AiPlannerModule, TransportModule, MarketplaceModule, AIModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
=======
  imports: [
    AuthModule,
    UsersModule,
    AiPlannerModule,
    TransportModule,
    MarketplaceModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
