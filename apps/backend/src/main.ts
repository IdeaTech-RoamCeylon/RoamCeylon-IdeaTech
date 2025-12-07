import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
<<<<<<< HEAD
bootstrap();
=======
void bootstrap();
>>>>>>> eacf67e035f0add451dc4a8e2977c6226fd79296
