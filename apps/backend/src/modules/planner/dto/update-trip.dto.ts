import {
  IsString,
  IsDateString,
  IsOptional,
  IsObject,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripPreferencesDto } from './create-trip.dto';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Trip name must be less than 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Destination must be less than 100 characters' })
  destination?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  endDate?: string;

  @IsOptional()
  @IsObject({ message: 'Itinerary must be a valid object' })
  itinerary?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => TripPreferencesDto)
  preferences?: TripPreferencesDto;
}
