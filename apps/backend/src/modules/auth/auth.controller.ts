import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    @Post('send-otp')
    sendOtp() {
        return { message: 'OTP sent' };
    }

    @Post('verify-otp')
    verifyOtp() {
        return { token: 'mock-jwt-token' };
    }
}
