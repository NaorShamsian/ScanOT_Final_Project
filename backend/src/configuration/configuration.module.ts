import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtConfiguration, securityConfiguration } from './security';
import { appConfiguration } from './app';
import { redisConfiguration } from './redis';
import { storageConfiguration } from './storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: false,
      load: [
        appConfiguration,
        securityConfiguration,
        jwtConfiguration,
        redisConfiguration,
        storageConfiguration,
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigurationModule {}
