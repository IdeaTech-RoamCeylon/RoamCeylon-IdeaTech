import { Module } from '@nestjs/common';
import { PublicToursController } from './public-tours.controller';

@Module({
  controllers: [PublicToursController],
})
export class PublicToursModule {}
