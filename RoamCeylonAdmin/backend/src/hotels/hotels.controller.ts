import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * HotelsController
 *
 * Base path: /hotels
 *
 * One hotel (property) per provider.
 *
 * Partner (requires JWT):
 *   GET  /hotels/my            — the authenticated partner's hotel (or null)
 *   POST /hotels/upload-image  — upload a hotel image to the Nhost "Hotels" bucket
 *   POST /hotels               — create or update the partner's hotel (upsert)
 *   GET  /hotels/:id           — get a single hotel
 *   PUT  /hotels/:id           — update own hotel
 */
@Controller('hotels')
export class HotelsController {
  private readonly logger = new Logger(HotelsController.name);

  constructor(private readonly hotelsService: HotelsService) {}

  // ── Partner: own hotel ───────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get('my')
  getMyHotel(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} fetching their hotel`);
    return this.hotelsService.findByOwner(userId);
  }

  // ── Upload image (proxy to Nhost Storage via admin secret) ───────────────

  @UseGuards(NhostJwtGuard)
  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  uploadImage(@Body() body: { base64: string; mimeType?: string }) {
    return this.hotelsService.uploadImage(
      body.base64,
      body.mimeType ?? 'image/jpeg',
    );
  }

  // ── Create or update (upsert) ────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  upsert(@Req() req: AuthRequest, @Body() dto: CreateHotelDto) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} saving hotel "${dto.name}"`);
    return this.hotelsService.upsertForOwner(userId, dto);
  }

  // ── Single hotel ─────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Fetching hotel ${id}`);
    return this.hotelsService.findOne(id);
  }

  // ── Update by id ─────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
    @Req() req: AuthRequest,
  ) {
    const { userId, role } = req.user;
    const isAdmin = role === 'admin' || role === 'super_admin';
    this.logger.log(`User ${userId} updating hotel ${id}`);
    return this.hotelsService.update(id, dto, userId, isAdmin);
  }
}
