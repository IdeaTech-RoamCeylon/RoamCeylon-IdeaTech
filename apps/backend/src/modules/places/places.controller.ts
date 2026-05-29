import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('image/:placeName')
  async getPlaceImage(@Param('placeName') placeName: string, @Res() res: Response) {
    const presignedUrl = await this.placesService.getPresignedUrlForPlace(placeName);
    
    if (presignedUrl) {
      // Issue a temporary redirect to the 30-second presigned URL
      return res.redirect(302, presignedUrl);
    } else {
      // If no image is found or cache misses, return 404 to trigger frontend fallback
      return res.status(404).send('Image not found');
    }
  }
}
