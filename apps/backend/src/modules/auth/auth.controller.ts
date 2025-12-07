<<<<<<< HEAD
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
=======
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body('phoneNumber') phoneNumber: string): { message: string } {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    return this.authService.verifyOtp(phoneNumber, otp);
  }
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
}
