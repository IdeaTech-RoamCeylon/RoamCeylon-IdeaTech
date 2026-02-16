import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class PlannerFeedbackDto {
    @IsInt()
    tripId: number;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number

    @IsOptional()
    @IsString()
    reason?: string;
}
