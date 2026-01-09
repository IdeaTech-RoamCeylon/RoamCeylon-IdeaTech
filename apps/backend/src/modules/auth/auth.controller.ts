import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto): { message: string } {
    return this.authService.sendOtp(dto.phoneNumber);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
  ): { accessToken: string; user: { id: string; phoneNumber: string } } {
    return this.authService.verifyOtp(dto.phoneNumber, dto.otp);
  }
}
