import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { IDENTIFIERS } from '../../shared';
import { INFO, ERRORS } from '../../common/types/log';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: {
    ping: jest.Mock;
    quit: jest.Mock;
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    // Создаем мок для Redis клиента
    mockRedisClient = {
      ping: jest.fn(),
      quit: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: IDENTIFIERS.REDIS_CLIENT,
          useValue: mockRedisClient,
        },
        {
          provide: IDENTIFIERS.INFO,
          useValue: INFO,
        },
        {
          provide: IDENTIFIERS.ERRORS,
          useValue: ERRORS,
        },
        {
          provide: 'Logger',
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should throw error on Redis connection failure', async () => {
      const error = new Error('Connection failed');
      mockRedisClient.ping.mockRejectedValue(error);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'Connection failed',
      );
    });
  });

  describe('onApplicationShutdown', () => {
    it('should close Redis connection', async () => {
      await service.onApplicationShutdown();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('Redis operations', () => {
    it('should insert key-value pair', async () => {
      const key = 'test-key';
      const value = 'test-value';

      mockRedisClient.set.mockResolvedValue('OK');

      await service.insert(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should validate key-value pair', async () => {
      const key = 'test-key';
      const value = 'test-value';

      mockRedisClient.get.mockResolvedValue(value);

      const result = await service.validate(key, value);

      expect(result).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    });

    it('should invalidate key', async () => {
      const key = 'test-key';

      mockRedisClient.del.mockResolvedValue(1);

      await service.invalidate(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });
});
