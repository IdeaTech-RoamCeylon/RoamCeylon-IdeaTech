import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { TourGuideService } from './tour-guide.service';
import { CreatePublicInquiryDto } from './dto/create-public-inquiry.dto';

@Controller('public-tours')
export class PublicTourController {
  private readonly logger = new Logger(PublicTourController.name);

  constructor(private readonly tourGuideService: TourGuideService) {}

  @Get('packages')
  async getActivePackages() {
    this.logger.log('Fetching all active tour packages for public app');
    return this.tourGuideService.findAllActivePublicPackages();
  }

  @Post('inquiries')
  async createPublicInquiry(@Body() dto: CreatePublicInquiryDto) {
    this.logger.log(
      `Received public inquiry for package ${dto.packageId} from ${dto.guestName}`,
    );
    return this.tourGuideService.createPublicInquiry(dto);
  }
}
