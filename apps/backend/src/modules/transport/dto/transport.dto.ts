import { IsNotEmpty, IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyDriversQueryDto {
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(100)
    @Max(50000)
    radius?: number;
}

export class AcceptRideDto {
    @IsNumber()
    @IsNotEmpty()
    rideId: number;

    @IsString()
    @IsNotEmpty()
    driverId: string;
}
