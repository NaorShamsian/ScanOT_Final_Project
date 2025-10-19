import { registerAs } from '@nestjs/config';
import { RedisConfiguration } from './redis.configuration.interface';

export const redisConfiguration = registerAs(
  'redis',
  (): RedisConfiguration => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  }),
);
