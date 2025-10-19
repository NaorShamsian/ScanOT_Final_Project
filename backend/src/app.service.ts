import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/services/redis.service';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkRedisHealth(): Promise<string> {
    try {
      return await this.redisService.ping();
    } catch {
      throw new Error('Connection failed');
    }
  }
}
