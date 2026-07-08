import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  squareFootage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nightlyRate?: number;

  @IsOptional()
  @IsArray()
  amenities?: string[];

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  galleryUrls?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
