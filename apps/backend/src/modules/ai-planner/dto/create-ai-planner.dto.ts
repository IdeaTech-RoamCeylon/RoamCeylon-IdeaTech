import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UserPreferencesDto {
    @IsArray()
    @IsString({ each: true })
    interests: string[];

    @IsString()
    @IsOptional()
    travelStyle?: string; // 'budget', 'luxury', 'balanced'
}

export class DateRangeDto {
    @IsDateString()
    start: string;

    @IsDateString()
    end: string;
}

export class CreatePlanDto {
    @ValidateNested()
    @Type(() => UserPreferencesDto)
    preferences: UserPreferencesDto;

    @ValidateNested()
    @Type(() => DateRangeDto)
    @IsOptional()
    dates?: DateRangeDto;

    @IsNumber()
    @Min(1)
    @Max(14)
    days: number;

    @IsString()
    @IsOptional()
    budget?: string;
}

export interface DayPlan {
    day: number;
    activities: string[];
    location: string;
}

export interface ItineraryResponse {
    itinerary: DayPlan[];
    isFallback: boolean;
    message?: string;
}
