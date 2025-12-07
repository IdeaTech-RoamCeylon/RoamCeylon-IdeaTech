import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
<<<<<<< HEAD
  providers: [AuthService]
=======
  providers: [AuthService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class AuthModule {}
