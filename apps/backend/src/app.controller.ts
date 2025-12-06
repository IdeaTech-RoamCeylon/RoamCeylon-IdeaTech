import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Post('auth/send-otp')
  sendOtp(): { ok: boolean } {
    return { ok: true };
  }

  @Post('auth/verify-otp')
  verifyOtp(): { token: string } {
    return { token: 'fake-jwt' };
  }

  @Get('users/me')
  getMe(): { id: string; phone: string; name: string } {
    return {
      id: 'user-123',
      phone: '+1234567890',
      name: 'Test User',
    };
  }
}
