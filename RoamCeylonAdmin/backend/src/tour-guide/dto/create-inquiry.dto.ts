import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInquiryDto {
  @IsString()
  guestName: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestAvatar?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  tourInterest?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pipelineValue?: number;
}
