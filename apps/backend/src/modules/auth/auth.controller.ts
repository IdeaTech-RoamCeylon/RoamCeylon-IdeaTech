import { Body, Controller, Post, Logger } from '@nestjs/common';
// import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateOtpDto } from './dto/create-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
// @UseGuards(ThrottlerGuard)
// @Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  // @Throttle removed (handled by guard default logic)
  sendOtp(@Body() createOtpDto: CreateOtpDto): { message: string } {
    this.logger.log(
      `Auth send-otp triggered for phone: ${createOtpDto.phoneNumber}`,
    );
    return this.authService.sendOtp(createOtpDto.phoneNumber);
  }

  @Post('verify-otp')
  // @Throttle removed
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): {
    accessToken: string;
    user: { id: string; phoneNumber: string };
  } {
    this.logger.log(
      `Auth verify-otp triggered for phone: ${verifyOtpDto.phoneNumber}`,
    );
    return this.authService.verifyOtp(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otp,
    );
  }
}
