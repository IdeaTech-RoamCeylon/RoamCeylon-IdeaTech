import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { PRIVACY_POLICY_HTML } from './privacy-policy.html';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.appService.checkHealth();
  }

  @Get('privacy-policy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPrivacyPolicy(): string {
    return PRIVACY_POLICY_HTML;
  }
}
