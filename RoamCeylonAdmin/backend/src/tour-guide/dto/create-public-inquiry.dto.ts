import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePublicInquiryDto {
  @IsString()
  packageId: string;

  @IsString()
  date: string;

  @IsNumber()
  @Min(1)
  numberOfPeople: number;

  @IsString()
  guestName: string;

  @IsString()
  guestEmail: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  guestAvatar?: string;
}
