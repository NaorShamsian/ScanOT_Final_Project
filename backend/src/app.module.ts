import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { IamModule } from './iam/iam.module';
import { CommonModule } from './common/common.module';
import { ConfigurationModule, appConfiguration } from './configuration';
import { PrismaModule } from './prisma/prisma.module';
import { JwtGuard } from './iam/authentication/guard';
import { LoggerModule } from 'nestjs-pino';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigurationModule,
    ConfigModule.forFeature(appConfiguration),
    CommonModule,
    PrismaModule,
    UsersModule,
    IamModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: true,
        customProps: (req) => ({ reqId: req.id }),
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                },
              },
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
      },
    }),
    RedisModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
