import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { SeatsService } from './seats/seats.service';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config(); // Load environment variables from .env file
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          return `${error.property} - ${Object.values(error.constraints).join(', ')}`;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('');

  // Create sample seats if none exist
  const seatsService = app.get(SeatsService);
  await seatsService.createSeats();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Payment service is running on: http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`💳 Payment API: http://localhost:${port}/api/v1/payments`);
  console.log(`🪑 Seats API: http://localhost:${port}/api/v1/seats`);
  console.log(`🔔 Webhook: http://localhost:${port}/api/payment/webhook`);
}

bootstrap();
