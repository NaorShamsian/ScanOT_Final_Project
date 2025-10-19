import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../redis/services/redis.service';

@Injectable()
export class RefreshTokenIdsStorage {
  constructor(private readonly redisService: RedisService) {}

  async addRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redisService.insert(userId, tokenId);
  }

  async isRefreshTokenRevoked(
    userId: string,
    tokenId: string,
  ): Promise<boolean> {
    return await this.redisService.validate(userId, tokenId);
  }

  async removeRefreshToken(tokenId: string): Promise<void> {
    await this.redisService.invalidate(tokenId);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.redisService.invalidate(userId);
  }
}
