import { IsString, IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(['confirmed', 'pending', 'completed', 'cancelled'])
  status: string;
}
