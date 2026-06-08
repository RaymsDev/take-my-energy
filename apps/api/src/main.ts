import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app/app.module';
import { LoggingInterceptor } from './app/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env['PORT'] || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Application running on http://localhost:${port}/api`);
}

bootstrap();
