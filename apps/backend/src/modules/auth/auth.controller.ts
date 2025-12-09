import { Body, Controller, Post, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('send-otp')
  sendOtp(@Body('phoneNumber') phoneNumber: string): { message: string } {
    this.logger.log(`Auth send-otp triggered for phone: ${phoneNumber}`);
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    this.logger.log(`Auth verify-otp triggered for phone: ${phoneNumber}`);
    return this.authService.verifyOtp(phoneNumber, otp);
  }
}
