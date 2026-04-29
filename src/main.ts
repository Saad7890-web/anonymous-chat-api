import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { APP_PREFIX } from "./common/constants/app.constants";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";
import { validationExceptionFactory } from "./common/pipes/validation-exception.factory";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(APP_PREFIX);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => validationExceptionFactory(errors),
    }),
  );

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
