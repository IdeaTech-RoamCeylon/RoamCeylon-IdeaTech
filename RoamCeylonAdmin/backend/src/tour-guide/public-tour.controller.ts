import { Controller, Get, Logger } from '@nestjs/common';
import { TourGuideService } from './tour-guide.service';

@Controller('public-tours')
export class PublicTourController {
  private readonly logger = new Logger(PublicTourController.name);

  constructor(private readonly tourGuideService: TourGuideService) {}

  @Get('packages')
  async getActivePackages() {
    this.logger.log('Fetching all active tour packages for public app');
    return this.tourGuideService.findAllActivePublicPackages();
  }
}
