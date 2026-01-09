import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SendOtpDto {
    @IsPhoneNumber()
    @IsNotEmpty()
    phoneNumber: string;
}

export class VerifyOtpDto {
    @IsPhoneNumber()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    @Length(4, 6)
    otp: string;
}
