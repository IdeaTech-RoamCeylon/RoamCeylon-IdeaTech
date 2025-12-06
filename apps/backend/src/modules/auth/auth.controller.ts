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
}
