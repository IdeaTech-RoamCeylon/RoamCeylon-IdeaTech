import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsIn,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// 1. Define the specific change happening
class TripChangeDetailsDto {
  @IsString()
  @IsIn(['REORDER', 'DELAY', 'ADD_PLACE', 'REMOVE_PLACE'])
  type: 'REORDER' | 'DELAY' | 'ADD_PLACE' | 'REMOVE_PLACE';

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  value?: number;
}

// 2. Define the current state of the trip
class CurrentDestinationDto {
  @IsString()
  placeId: string;

  @IsNumber()
  order: number;

  @IsString()
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
}

// ADD THIS NEW CLASS FOR STRUCTURED EXPLANATIONS
export class DayExplanationDto {
  @IsString()
  sequence: string; // "Sigiriya (6 AM) → Minneriya (10 AM) → Dambulla (3 PM)"

  @IsString()
  reasoning: string; // "Early start for cool weather, safari at peak time"

  @IsString()
  @IsOptional()
  logistics?: string; // "Total driving: 45km, 1.5 hours"
}

// ADD THIS NEW CLASS FOR ACTIVITY DETAILS
export class ActivityDto {
  @IsString()
  name: string;

  @IsString()
  time: string;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  reason?: string; // "Best visited 6-9 AM for wildlife viewing"
}

// ADD THIS NEW CLASS FOR DAY STRUCTURE
export class DayDto {
  @IsNumber()
  dayNumber: number;

  @IsString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities: ActivityDto[];

  @ValidateNested()
  @Type(() => DayExplanationDto)
  @IsObject()
  explanation: DayExplanationDto;
}

// 3. The Main DTO for the API Request
export class UpdateTripRequestDto {
  @IsString()
  tripId: string;

  @ValidateNested()
  @Type(() => TripChangeDetailsDto)
  change: TripChangeDetailsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentDestinationDto)
  currentPlan: CurrentDestinationDto[];
}
