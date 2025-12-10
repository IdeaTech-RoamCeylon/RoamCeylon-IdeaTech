import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class CreateOtpDto {
    @IsNotEmpty()
    @IsPhoneNumber('LK')
    phoneNumber: string;
}
