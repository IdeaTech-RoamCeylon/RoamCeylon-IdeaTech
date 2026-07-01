import { Controller, Get } from '@nestjs/common';
import { PublicActivitiesService } from './public-activities.service';

@Controller('public-activities')
export class PublicActivitiesController {
  constructor(private readonly publicActivitiesService: PublicActivitiesService) {}

  @Get()
  async findAll() {
    return this.publicActivitiesService.findAll();
  }
}
