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
import type { Request } from 'express';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { NhostJwtGuard } from '../common/guards/nhost-jwt.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';

interface AuthRequest extends Request {
  user: { userId: string; role: string };
}

/**
 * ActivitiesController
 *
 * Base path: /activities
 *
 * All routes require JWT authentication via NhostJwtGuard.
 *
 * Dashboard:
 *   GET    /activities/dashboard          — dashboard stats
 *
 * Activities CRUD:
 *   GET    /activities/list               — list provider's activities
 *   GET    /activities/list/:id           — get single activity
 *   POST   /activities/list               — create activity
 *   PUT    /activities/list/:id           — update activity
 *   DELETE /activities/list/:id           — delete activity
 *   PATCH  /activities/list/:id/status    — update activity status
 *
 * Schedule:
 *   GET    /activities/schedule           — upcoming bookings
 *
 * Image Upload:
 *   POST   /activities/upload-image       — upload image to Nhost Storage
 */
@Controller('activities')
@UseGuards(NhostJwtGuard)
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════

  @Get('dashboard')
  getDashboardStats(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Fetching activity dashboard stats for provider ${userId}`);
    return this.activitiesService.getDashboardStats(userId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════

  @Get('schedule')
  getUpcomingSchedule(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Provider ${userId} fetching upcoming schedule`);
    return this.activitiesService.findUpcomingSchedule(userId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ACTIVITIES CRUD
  // ══════════════════════════════════════════════════════════════════════════

  @Get('list')
  findAllActivities(@Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Provider ${userId} fetching their activities`);
    return this.activitiesService.findAllActivities(userId);
  }

  @Get('list/:id')
  findOneActivity(@Param('id') id: string) {
    this.logger.log(`Fetching activity ${id}`);
    return this.activitiesService.findOneActivity(id);
  }

  @UseGuards(VerifiedGuard)
  @Post('list')
  @HttpCode(HttpStatus.CREATED)
  createActivity(@Req() req: AuthRequest, @Body() dto: CreateActivityDto) {
    const { userId } = req.user;
    this.logger.log(`Provider ${userId} creating activity "${dto.name}"`);
    return this.activitiesService.createActivity(userId, dto);
  }

  @Put('list/:id')
  updateActivity(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @Req() req: AuthRequest,
  ) {
    const { userId } = req.user;
    this.logger.log(`Provider ${userId} updating activity ${id}`);
    return this.activitiesService.updateActivity(id, dto, userId);
  }

  @Delete('list/:id')
  @HttpCode(HttpStatus.OK)
  deleteActivity(@Param('id') id: string, @Req() req: AuthRequest) {
    const { userId } = req.user;
    this.logger.log(`Provider ${userId} deleting activity ${id}`);
    return this.activitiesService.deleteActivity(id, userId);
  }

  @Patch('list/:id/status')
  updateActivityStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    this.logger.log(`Updating activity ${id} status to "${status}"`);
    return this.activitiesService.updateActivityStatus(id, status);
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
    return this.activitiesService.uploadImage(
      body.base64,
      body.mimeType ?? 'image/jpeg',
      req.headers.authorization,
    );
  }
}
