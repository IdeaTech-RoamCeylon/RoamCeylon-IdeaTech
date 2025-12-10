import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Expo Go and mobile apps
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
