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
} from '@nestjs/common';
import { PlannerService, SavedTrip } from './planner.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) { }

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
    return this.plannerService.getTrip(req.user.userId, parseInt(id, 10));
  }

  @Put(':id')
  async updateTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateTripDto,
  ) {
    return this.plannerService.updateTrip(
      req.user.userId,
      parseInt(id, 10),
      body,
    );
  }

  @Delete(':id')
  async deleteTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<SavedTrip> {
    return this.plannerService.deleteTrip(req.user.userId, parseInt(id, 10));
  }

  @Post('feedback')
  async submitFeedback(
    @Req() req: RequestWithUser,
    @Body() body: CreateFeedbackDto,
  ) {
    return this.plannerService.submitFeedback(
      req.user.userId,
      body.tripId,
      body.feedbackValue,
    );
  }
}
