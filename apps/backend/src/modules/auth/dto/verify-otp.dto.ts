import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  IsNumberString,
} from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsPhoneNumber('LK')
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 6)
  @IsNumberString()
  otp: string;
}
