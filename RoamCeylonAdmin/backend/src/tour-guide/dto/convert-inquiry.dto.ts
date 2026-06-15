import { IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConvertInquiryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  guests: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}
