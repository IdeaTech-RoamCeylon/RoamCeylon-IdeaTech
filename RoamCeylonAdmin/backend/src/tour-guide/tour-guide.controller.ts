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
import type { Request } from 'express';
import { TourGuideService } from './tour-guide.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import type {
  PackageStatus,
  BookingStatus,
  InquiryStatus,
} from './entities/tour-guide.entity';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * TourGuideController
 *
 * Base path: /tour-guide
 *
 * All routes require JWT authentication via NhostJwtGuard.
 *
 * Packages:
 *   GET    /tour-guide/packages           — list guide's packages
 *   GET    /tour-guide/packages/:id       — get single package
 *   POST   /tour-guide/packages           — create a new package
 *   PUT    /tour-guide/packages/:id       — update own package
 *   DELETE /tour-guide/packages/:id       — delete own package
 *   PATCH  /tour-guide/packages/:id/status — update package status
 *
 * Image Upload:
 *   POST   /tour-guide/upload-image       — upload image to Nhost Storage
 *
 * Bookings:
 *   GET    /tour-guide/bookings           — list bookings (optionally ?status=)
 *   GET    /tour-guide/bookings/:id       — get single booking
 *   POST   /tour-guide/bookings           — create a booking
 *   PATCH  /tour-guide/bookings/:id/status — update booking status
 *
 * Inquiries:
 *   GET    /tour-guide/inquiries          — list inquiries (optionally ?status=)
 *   POST   /tour-guide/inquiries          — create an inquiry
 *   PATCH  /tour-guide/inquiries/:id/status — update inquiry status
 *
 * Notifications:
 *   GET    /tour-guide/notifications             — list notifications
 *   PATCH  /tour-guide/notifications/:id/read    — mark one as read
 *   PATCH  /tour-guide/notifications/read-all    — mark all as read
 *
 * Dashboard:
 *   GET    /tour-guide/dashboard          — dashboard stats
 */
@Controller('tour-guide')
@UseGuards(NhostJwtGuard)
export class TourGuideController {
  private readonly logger = new Logger(TourGuideController.name);

  constructor(private readonly tourGuideService: TourGuideService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════

  @Get('dashboard')
  getDashboardStats(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Fetching dashboard stats for guide ${userId}`);
    return this.tourGuideService.getDashboardStats(userId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PACKAGES
  // ══════════════════════════════════════════════════════════════════════════

  @Get('packages')
  findAllPackages(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} fetching their packages`);
    return this.tourGuideService.findAllPackages(userId);
  }

  @Get('packages/:id')
  findOnePackage(@Param('id') id: string) {
    this.logger.log(`Fetching package ${id}`);
    return this.tourGuideService.findOnePackage(id);
  }

  @Post('packages')
  @HttpCode(HttpStatus.CREATED)
  createPackage(@Req() req: AuthRequest, @Body() dto: CreatePackageDto) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} creating package "${dto.name}"`);
    return this.tourGuideService.createPackage(userId, dto);
  }

  @Put('packages/:id')
  updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
    @Req() req: AuthRequest,
  ) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} updating package ${id}`);
    return this.tourGuideService.updatePackage(id, dto, userId);
  }

  @Delete('packages/:id')
  @HttpCode(HttpStatus.OK)
  deletePackage(@Param('id') id: string, @Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} deleting package ${id}`);
    return this.tourGuideService.deletePackage(id, userId);
  }

  @Patch('packages/:id/status')
  updatePackageStatus(
    @Param('id') id: string,
    @Body('status') status: PackageStatus,
  ) {
    this.logger.log(`Updating package ${id} status to "${status}"`);
    return this.tourGuideService.updatePackageStatus(id, status);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  IMAGE UPLOAD
  // ══════════════════════════════════════════════════════════════════════════

  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  uploadImage(
    @Body() body: { base64: string; mimeType?: string },
    @Req() req: Request,
  ) {
    return this.tourGuideService.uploadImage(
      body.base64,
      body.mimeType ?? 'image/jpeg',
      req.headers.authorization,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BOOKINGS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('bookings')
  findAllBookings(@Req() req: AuthRequest, @Query('status') status?: string) {
    const { userId } = req.user;
    this.logger.log(
      `Guide ${userId} fetching bookings${status ? ` with status="${status}"` : ''}`,
    );
    return this.tourGuideService.findAllBookings(
      userId,
      status as BookingStatus | undefined,
    );
  }

  @Get('bookings/:id')
  findOneBooking(@Param('id') id: string) {
    this.logger.log(`Fetching booking ${id}`);
    return this.tourGuideService.findOneBooking(id);
  }

  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Req() req: AuthRequest, @Body() dto: CreateBookingDto) {
    const { userId } = req.user;
    this.logger.log(
      `Guide ${userId} creating booking for "${dto.customerName}"`,
    );
    return this.tourGuideService.createBooking(userId, dto);
  }

  @Patch('bookings/:id/status')
  updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    this.logger.log(`Updating booking ${id} status to "${dto.status}"`);
    return this.tourGuideService.updateBookingStatus(
      id,
      dto.status as BookingStatus,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  INQUIRIES
  // ══════════════════════════════════════════════════════════════════════════

  @Get('inquiries')
  findAllInquiries(@Req() req: AuthRequest, @Query('status') status?: string) {
    const { userId } = req.user;
    this.logger.log(
      `Guide ${userId} fetching inquiries${status ? ` with status="${status}"` : ''}`,
    );
    return this.tourGuideService.findAllInquiries(
      userId,
      status as InquiryStatus | undefined,
    );
  }

  @Post('inquiries')
  @HttpCode(HttpStatus.CREATED)
  createInquiry(@Req() req: AuthRequest, @Body() dto: CreateInquiryDto) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} creating inquiry from "${dto.guestName}"`);
    return this.tourGuideService.createInquiry(userId, dto);
  }

  @Patch('inquiries/:id/status')
  updateInquiryStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
  ) {
    this.logger.log(`Updating inquiry ${id} status to "${status}"`);
    return this.tourGuideService.updateInquiryStatus(id, status);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════

  @Get('notifications')
  findAllNotifications(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} fetching notifications`);
    return this.tourGuideService.findAllNotifications(userId);
  }

  @Patch('notifications/read-all')
  markAllAsRead(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Guide ${userId} marking all notifications as read`);
    return this.tourGuideService.markAllAsRead(userId);
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string) {
    this.logger.log(`Marking notification ${id} as read`);
    return this.tourGuideService.markAsRead(id);
  }
}
