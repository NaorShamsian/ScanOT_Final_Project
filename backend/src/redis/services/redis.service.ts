import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import Redis from 'ioredis';
import { IDENTIFIERS } from '../../shared';
import { WrongRefreshTokenError } from '../error';
import { IRedisService } from '../interfaces';

@Injectable()
export class RedisService
  implements OnApplicationBootstrap, OnApplicationShutdown, IRedisService
{
  private readonly redisClient: Redis;

  constructor(
    @Inject(IDENTIFIERS.REDIS_CLIENT) redisClient: Redis,
    private readonly logger: Logger,
  ) {
    this.redisClient = redisClient;
  }

  public async onApplicationBootstrap(): Promise<void> {
    try {
      this.logger.log('Attempting to connect to Redis...');
      await this.redisClient.ping();
      this.logger.log('Redis connection successful');
    } catch (error) {
      this.logger.error('Redis connection failed', error);
      throw error;
    }
  }

  public async onApplicationShutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
  public async ping(): Promise<string> {
    return await this.redisClient.ping();
  }

  public getRedisClient(): Promise<Redis> {
    return Promise.resolve(this.redisClient);
  }

  async insert(key: string, value: string): Promise<void> {
    try {
      this.logger.log(`Inserting key: ${key}, value length: ${value.length}`);
      await this.redisClient.set(key, value);
      this.logger.log(`Successfully inserted key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to insert key: ${key}`, error);
      throw error;
    }
  }

  async validate(key: string, value: string): Promise<boolean> {
    const storedValue = await this.redisClient.get(key);
    if (storedValue !== value) {
      throw new WrongRefreshTokenError();
    }
    return storedValue === value;
  }

  async invalidate(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
