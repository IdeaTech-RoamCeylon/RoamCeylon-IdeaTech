import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateShopDto {
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

  // Business hours
  @IsOptional()
  @IsBoolean()
  hoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  hoursText?: string; // e.g. "Mon-Sat, 9AM-6PM"

  // External integrations
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  // Location
  @IsOptional()
  @IsString()
  location?: string;
}
