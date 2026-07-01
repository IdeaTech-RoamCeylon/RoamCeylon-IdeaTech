import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('public-tours')
export class PublicToursController {
  private readonly logger = new Logger(PublicToursController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('packages')
  async getPackages() {
    this.logger.log('Fetching all published tour packages');
    const packages = await this.prisma.tourPackage.findMany({
      where: {
        status: { in: ['active', 'published', 'draft'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return packages;
  }
}
