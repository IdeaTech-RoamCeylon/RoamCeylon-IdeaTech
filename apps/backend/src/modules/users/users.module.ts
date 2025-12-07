import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
<<<<<<< HEAD
  providers: [UsersService]
=======
  providers: [UsersService],
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
})
export class UsersModule {}
