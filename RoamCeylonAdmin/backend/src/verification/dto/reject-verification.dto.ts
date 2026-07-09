import { IsString, IsOptional } from 'class-validator';

export class RejectVerificationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
