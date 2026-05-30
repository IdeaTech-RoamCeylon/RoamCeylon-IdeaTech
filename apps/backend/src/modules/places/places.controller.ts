import { Controller, Get, Param, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  private readonly logger = new Logger(PlacesController.name);

  constructor(private readonly placesService: PlacesService) {}

  @Get('image/:placeName')
  async getPlaceImage(
    @Param('placeName') placeName: string,
    @Res() res: Response,
  ) {
    const presignedUrl =
      await this.placesService.getPresignedUrlForPlace(placeName);

    if (presignedUrl) {
      try {
        const imageRes = await axios.get(presignedUrl, {
          responseType: 'stream',
        });
        res.setHeader(
          'Content-Type',
          (imageRes.headers['content-type'] as string) || 'image/jpeg',
        );
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return (imageRes.data as NodeJS.ReadableStream).pipe(res);
      } catch (error) {
        this.logger.error(
          `Failed to proxy image for ${placeName}: ${(error as Error).message}`,
        );
        return res.status(502).send('Error fetching image from storage');
      }
    } else {
      return res.status(404).send('Image not found');
    }
  }
}
