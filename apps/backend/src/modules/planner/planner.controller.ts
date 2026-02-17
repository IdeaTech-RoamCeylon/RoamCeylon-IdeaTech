import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Req,
  UseGuards,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { PlannerService, SavedTrip } from './planner.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { PlannerMetricsInterceptor } from './interceptors/planner-metrics.interceptor';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@Controller('planner')
@UseGuards(JwtAuthGuard)
@UseInterceptors(PlannerMetricsInterceptor)
export class PlannerController {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly metricsInterceptor: PlannerMetricsInterceptor,
  ) { }

  @Post('save')
  async saveTrip(
    @Req() req: RequestWithUser,
    @Body() body: CreateTripDto,
  ): Promise<SavedTrip> {
    return this.plannerService.saveTrip(req.user.userId, body);
  }

  @Get('history')
  async getHistory(@Req() req: RequestWithUser): Promise<SavedTrip[]> {
    return this.plannerService.getHistory(req.user.userId);
  }

  @Get(':id')
  async getTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<SavedTrip | null> {
    return this.plannerService.getTrip(req.user.userId, id);
  }

  @Put(':id')
  async updateTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateTripDto,
  ) {
    return this.plannerService.updateTrip(req.user.userId, id, body);
  }

  @Delete(':id')
  async deleteTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<SavedTrip> {
    return this.plannerService.deleteTrip(req.user.userId, id);
  }

  @Post('feedback')
  async submitFeedback(
    @Req() req: RequestWithUser,
    @Body() body: CreateFeedbackDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.plannerService.submitFeedback(
      req.user.userId,
      body.tripId,
      body.feedbackValue,
    );
  }

  /**
   * Get aggregated feedback for a specific trip
   * Day 46 Task 1: Feedback Aggregation Logic
   */
  @Get('feedback/trip/:tripId')
  async getTripFeedback(@Param('tripId') tripId: string) {
    return this.plannerService.getFeedbackAggregation(tripId);
  }

  /**
   * Get aggregated feedback by destination
   */
  @Get('feedback/destination/:destination')
  async getDestinationFeedback(@Param('destination') destination: string) {
    return this.plannerService.getDestinationFeedback(destination);
  }

  /**
   * Get aggregated feedback by category
   */
  @Get('feedback/category/:category')
  async getCategoryFeedback(@Param('category') category: string) {
    return this.plannerService.getCategoryFeedback(category);
  }

  /**
   * Get performance metrics
   * Day 46 Task 3: Performance & Stability Check
   */
  @Get('metrics')
  async getMetrics() {
    return this.metricsInterceptor.getPerformanceStats();
  }
}
