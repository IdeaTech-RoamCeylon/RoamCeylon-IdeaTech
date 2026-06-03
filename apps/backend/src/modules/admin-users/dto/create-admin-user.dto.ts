import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @IsIn(['hotel_manager', 'activity_provider', 'shop_partner', 'tour_guide'])
  role: string;
}
