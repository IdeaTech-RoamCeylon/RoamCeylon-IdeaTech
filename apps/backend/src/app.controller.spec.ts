import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

<<<<<<< HEAD
  describe('root', () => {
    it('should return health status', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });
=======
  describe('health', () => {
    it('should return status ok', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('auth', () => {
    it('should return ok for send-otp', () => {
      expect(appController.sendOtp()).toEqual({ ok: true });
    });
  });
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
});
