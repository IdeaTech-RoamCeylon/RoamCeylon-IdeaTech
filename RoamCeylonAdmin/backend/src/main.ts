import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Allow requests from the Expo dev client and any local LAN address
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Increase payload limit to support base64 image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global validation pipe — strips unknown fields, transforms payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // lenient for now
    }),
  );

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 RoamCeylon Admin backend running on http://localhost:${port}`);
}

bootstrap().catch((err: unknown) => {
  console.error(err);
});
