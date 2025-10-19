import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './services/redis.service';
import { redisConfiguration, RedisConfiguration } from '../configuration';
import { IDENTIFIERS } from '../shared';
import { CommonModule } from '../common';

@Module({
  imports: [ConfigModule.forFeature(redisConfiguration), CommonModule],
  providers: [
    {
      provide: IDENTIFIERS.REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const redisConfig = configService.get<RedisConfiguration>('redis');

        if (!redisConfig) {
          throw new Error('Redis configuration not found');
        }

        return new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [IDENTIFIERS.REDIS_CLIENT, RedisService],
})
export class RedisModule {}
