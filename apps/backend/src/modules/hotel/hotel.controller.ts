import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { HotelService } from './hotel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

// ─── DTOs ───────────────────────────────────────────────────────────────────

export class GetSuggestionsDto {
  @IsNotEmpty()
  @IsString()
  destination: string;

  @IsOptional()
  @IsString()
  budget?: string;
}

export class BookHotelDto {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsNotEmpty()
  @IsString()
  roomType: string;

  @IsNotEmpty()
  @IsString()
  checkIn: string;

  @IsNotEmpty()
  @IsString()
  checkOut: string;

  @IsArray()
  @IsString({ each: true })
  guests: string[];
}

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

// ─── Controller ─────────────────────────────────────────────────────────────

@Controller('hotel')
export class HotelController {
  private readonly logger = new Logger(HotelController.name);

  constructor(private readonly hotelService: HotelService) {}

  @Get('suggest')
  getSuggestions(@Query() query: GetSuggestionsDto) {
    this.logger.log(
      `Fetching hotel suggestions for destination: ${query.destination}, budget: ${query.budget || 'Any'}`,
    );
    return this.hotelService.getSuggestedHotels(
      query.destination,
      query.budget,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('book')
  bookHotel(@Req() req: RequestWithUser, @Body() body: BookHotelDto) {
    this.logger.log(
      `User ${req.user.userId} is booking hotel ${body.hotelId} (${body.roomType})`,
    );
    return this.hotelService.bookHotel(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  getBookings(@Req() req: RequestWithUser) {
    this.logger.log(
      `Fetching active hotel bookings for user ${req.user.userId}`,
    );
    return this.hotelService.getBookings(req.user.userId);
  }
}
