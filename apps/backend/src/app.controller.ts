import { Controller, Get, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string } {
    this.logger.log('Health check triggered');
    return { status: 'ok' };
  }

  @Post('auth/send-otp')
  sendOtp(): { ok: boolean } {
    this.logger.log('Auth send-otp triggered');
    return { ok: true };
  }

  @Post('auth/verify-otp')
  verifyOtp(): { token: string } {
    return { token: 'fake-jwt' };
  }
}
