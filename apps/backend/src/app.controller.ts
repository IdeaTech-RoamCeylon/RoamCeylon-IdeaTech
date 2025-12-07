<<<<<<< HEAD
import { Controller, Get } from '@nestjs/common';
=======
import { Controller, Get, Post } from '@nestjs/common';
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
import { AppService } from './app.service';

@Controller()
export class AppController {
<<<<<<< HEAD
  constructor(private readonly appService: AppService) { }
=======
  constructor(private readonly appService: AppService) {}
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
<<<<<<< HEAD
=======

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
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
}
