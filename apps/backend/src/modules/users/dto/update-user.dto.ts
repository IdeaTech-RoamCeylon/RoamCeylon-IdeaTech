import { IsEmail, IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: string;
}
