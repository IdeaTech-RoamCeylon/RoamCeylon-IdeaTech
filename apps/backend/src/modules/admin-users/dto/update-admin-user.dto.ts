import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['hotel_manager', 'activity_provider', 'shop_partner', 'tour_guide'])
  role?: string;
}
