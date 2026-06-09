import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import type { ShopStatus } from './entities/shop.entity';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * ShopsController
 *
 * Base path: /shops
 *
 * Public:
 *   GET  /shops/stats           — dashboard stats (total, active, growth %)
 *
 * Partner (requires JWT):
 *   GET  /shops/my              — list the authenticated partner's shops
 *   POST /shops                 — create a new shop (goes to "under_review")
 *   PUT  /shops/:id             — update own shop
 *   DELETE /shops/:id           — delete own shop
 *
 * All shops (admin / general):
 *   GET  /shops                 — list all shops (optionally filter by ?status=)
 *   GET  /shops/:id             — get a single shop
 *   PATCH /shops/:id/status     — update shop status (admin only in production)
 */
@Controller('shops')
export class ShopsController {
  private readonly logger = new Logger(ShopsController.name);

  constructor(private readonly shopsService: ShopsService) {}

  // ── Stats (public) ───────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    this.logger.log('Fetching shop dashboard stats');
    return this.shopsService.getStats();
  }

  // ── Partner: own shops ───────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get('my')
  getMyShops(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} fetching their shops`);
    return this.shopsService.findByOwner(userId);
  }

  // ── All shops ────────────────────────────────────────────────────────────

  @Get()
  findAll(@Query('status') status?: string) {
    this.logger.log(`Fetching all shops${status ? ` with status="${status}"` : ''}`);
    return this.shopsService.findAll(status as ShopStatus | undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Fetching shop ${id}`);
    return this.shopsService.findOne(id);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @Body() dto: CreateShopDto) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} creating shop "${dto.name}"`);
    return this.shopsService.create(userId, dto);
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
    @Req() req: AuthRequest,
  ) {
    const { userId, role } = req.user;
    const isAdmin = role === 'admin' || role === 'super_admin';
    this.logger.log(`User ${userId} updating shop ${id}`);
    return this.shopsService.update(id, dto, userId, isAdmin);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    const { userId, role } = req.user;
    const isAdmin = role === 'admin' || role === 'super_admin';
    this.logger.log(`User ${userId} deleting shop ${id}`);
    return this.shopsService.remove(id, userId, isAdmin);
  }

  // ── Update status (admin) ────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShopStatus,
    @Req() req: AuthRequest,
  ) {
    this.logger.log(`User ${req.user.userId} updating shop ${id} status to "${status}"`);
    return this.shopsService.updateStatus(id, status);
  }
}
