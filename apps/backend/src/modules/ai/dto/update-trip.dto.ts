import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsIn } from 'class-validator';
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