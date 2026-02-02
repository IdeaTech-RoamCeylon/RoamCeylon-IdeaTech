import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
