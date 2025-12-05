import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('send-otp')
    async sendOtp(@Body('phoneNumber') phoneNumber: string) {
        return this.authService.sendOtp(phoneNumber);
    }

    @Post('verify-otp')
    async verifyOtp(@Body('phoneNumber') phoneNumber: string, @Body('otp') otp: string) {
        return this.authService.verifyOtp(phoneNumber, otp);
    }
}
