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
import { PlannerService, TripData, SavedTrip } from './planner.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('save')
  async saveTrip(
    @Req() req: RequestWithUser,
    @Body() body: TripData,
  ): Promise<SavedTrip> {
    return this.plannerService.saveTrip(req.user.userId, body);
  }

  @Get('history')
  async getHistory(@Req() req: RequestWithUser): Promise<SavedTrip[]> {
    return this.plannerService.getHistory(req.user.userId);
  }

  @Put(':id')
  async updateTrip(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: TripData,
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
}
