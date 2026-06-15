import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePublicInquiryDto {
  @IsString()
  packageId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

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

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
