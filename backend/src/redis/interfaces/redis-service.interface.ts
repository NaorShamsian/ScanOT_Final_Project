export interface IRedisService {
  ping(): Promise<string>;
  getRedisClient(): Promise<import('ioredis').default>;
  insert(key: string, value: string): Promise<void>;
  validate(key: string, value: string): Promise<boolean>;
  invalidate(key: string): Promise<void>;
}
