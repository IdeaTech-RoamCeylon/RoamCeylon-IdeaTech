import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import type { RoomStatus } from './entities/room.entity';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * RoomsController
 *
 * Base path: /rooms
 *
 * Partner (requires JWT):
 *   GET    /rooms/my            — list the authenticated partner's rooms
 *   GET    /rooms/:id           — get a single room
 *   POST   /rooms/upload-image  — upload a room image to the Nhost "Hotels" bucket
 *   POST   /rooms               — create a new room
 *   PUT    /rooms/:id           — update own room
 *   DELETE /rooms/:id           — delete own room
 *   PATCH  /rooms/:id/status    — update room status
 */
@Controller('rooms')
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(private readonly roomsService: RoomsService) {}

  // ── Partner: own rooms ───────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get('my')
  getMyRooms(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} fetching their rooms`);
    return this.roomsService.findByOwner(userId);
  }

  // ── Upload image (proxy to Nhost Storage via admin secret) ───────────────

  @UseGuards(NhostJwtGuard)
  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  uploadImage(@Body() body: { base64: string; mimeType?: string }) {
    return this.roomsService.uploadImage(
      body.base64,
      body.mimeType ?? 'image/jpeg',
    );
  }

  // ── Single room ──────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    this.logger.log(`Fetching room ${id}`);
    return this.roomsService.findOne(id);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @Body() dto: CreateRoomDto) {
    const { userId } = req.user;
    this.logger.log(`Partner ${userId} creating room "${dto.name}"`);
    return this.roomsService.create(userId, dto);
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @Req() req: AuthRequest,
  ) {
    const { userId, role } = req.user;
    const isAdmin = role === 'admin' || role === 'super_admin';
    this.logger.log(`User ${userId} updating room ${id}`);
    return this.roomsService.update(id, dto, userId, isAdmin);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    const { userId, role } = req.user;
    const isAdmin = role === 'admin' || role === 'super_admin';
    this.logger.log(`User ${userId} deleting room ${id}`);
    return this.roomsService.remove(id, userId, isAdmin);
  }

  // ── Update status ────────────────────────────────────────────────────────

  @UseGuards(NhostJwtGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RoomStatus,
    @Req() req: AuthRequest,
  ) {
    this.logger.log(
      `User ${req.user.userId} updating room ${id} status to "${status}"`,
    );
    return this.roomsService.updateStatus(id, status);
  }
}
