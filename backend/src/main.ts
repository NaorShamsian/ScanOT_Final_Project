import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { randomUUID } from 'crypto';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';   // <<< הוספה
import { AppModule } from './app.module';
import { appConfiguration, IAppConfiguration } from './configuration';
// import { AllExceptionsFilter } from './common/filters';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      genReqId: () => `req-${randomUUID()}`,
    }),
    { bufferLogs: true },
  );

  const appConfig: IAppConfiguration = app.get<IAppConfiguration>(
    appConfiguration.KEY,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // app.useGlobalFilters(new AllExceptionsFilter());

  await app.register(fastifyCookie);

  await app.register(fastifySecureSession, {
    secret: appConfig.sessionSecret,
    salt: appConfig.sessionSalt,
  });

  await app.register(fastifyPassport.initialize());

  // <<< הוספת CORS
  await app.register(fastifyCors, {
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true,
  });

  app.useLogger(app.get(Logger));

  const port = appConfig.port ?? 3003;
  const host = '0.0.0.0'; // בתוך קונטיינר חובה

  await app.listen({ port, host });

  app.get(Logger).log(`API listening on http://${host}:${port}`, 'Bootstrap');
}

void bootstrap();
