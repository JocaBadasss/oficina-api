import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { createAdmin } from './bootstrap';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN, // ou seu domínio do front-end
    credentials: true, // 🔥 importante para cookies
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,

      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = errors.map((err) => {
          if (err.constraints) {
            const messages = Object.values(err.constraints);
            return `${err.property}: ${messages.join(', ')}`;
          }
          return `${err.property}: valor inválido`;
        });

        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: formattedErrors,
        });
      },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3333, '0.0.0.0');

  const prisma = app.get(PrismaService);

  await createAdmin(prisma);
}
bootstrap();
