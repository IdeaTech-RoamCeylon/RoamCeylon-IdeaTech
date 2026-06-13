import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;
}
